import { supabase } from '../lib/supabaseClient';

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

async function getRoomMembers(roomId) {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId);

  if (error) {
    throw new Error(`Não foi possível carregar os membros da sala: ${error.message}`);
  }

  return data || [];
}

async function buildRoomSession({ room, user }) {
  const members = await getRoomMembers(room.id);
  const me = members.find((member) => member.user_id === user.id);

  if (!me) {
    throw new Error('Sua participação nesta sala não foi encontrada.');
  }

  return {
    room,
    me,
    members,
  };
}

export async function createRoom({ name, userName, user }) {
  const { data: code, error: codeError } = await supabase.rpc('generate_room_code');

  if (codeError) {
    throw new Error(`Não foi possível gerar o código da sala: ${codeError.message}`);
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      code,
      name: name.trim(),
      owner_user_id: user.id,
      status: 'open',
    })
    .select('*')
    .single();

  if (roomError) {
    throw new Error(`Não foi possível criar a sala: ${roomError.message}`);
  }

  const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: room.id,
      user_id: user.id,
      name: userName.trim(),
      role: 'owner',
      status: 'active',
    });

  if (memberError) {
    throw new Error(`A sala foi criada, mas não foi possível adicionar você como dono: ${memberError.message}`);
  }

  return buildRoomSession({ room, user });
}

export async function joinRoom({ code, userName, user }) {
  const normalizedCode = normalizeCode(code);

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (roomError) {
    throw new Error(`Não foi possível buscar a sala: ${roomError.message}`);
  }

  if (!room) {
    throw new Error('Sala não encontrada. Confira o código e tente novamente.');
  }

  if (room.status === 'closed') {
    throw new Error('Esta sala está fechada e não aceita novos participantes.');
  }

  const { data: existingMember, error: memberLookupError } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberLookupError) {
    throw new Error(`Não foi possível verificar sua participação na sala: ${memberLookupError.message}`);
  }

  if (existingMember) {
    const { error: updateError } = await supabase
      .from('room_members')
      .update({
        name: userName.trim(),
        status: 'active',
      })
      .eq('id', existingMember.id);

    if (updateError) {
      throw new Error(`Não foi possível reativar sua entrada na sala: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        name: userName.trim(),
        role: 'guest',
        status: 'active',
      });

    if (insertError) {
      throw new Error(`Não foi possível entrar na sala: ${insertError.message}`);
    }
  }

  return buildRoomSession({ room, user });
}
