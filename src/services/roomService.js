import { supabase } from '../lib/supabaseClient';
import { createRoomEvent, listRoomEvents } from './eventService';
import { listQueueItems, promoteNextWaiting } from './queueService';

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

async function getRoom(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) {
    throw new Error(`Não foi possível carregar a sala: ${error.message}`);
  }

  return data;
}

async function getRoomMembers(roomId) {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Não foi possível carregar os membros da sala: ${error.message}`);
  }

  return data || [];
}

function enrichQueueItems(items, members) {
  return items.map((item) => ({
    ...item,
    member: members.find((member) => member.id === item.member_id) || null,
  }));
}

async function buildRoomSession({ room, user, promoteMissingStage = false }) {
  let members = await getRoomMembers(room.id);
  const me = members.find((member) => member.user_id === user.id);

  if (!me) {
    throw new Error('Sua participação nesta sala não foi encontrada.');
  }

  let queueItems = await listQueueItems(room.id);
  const hasOnStage = queueItems.some((item) => item.status === 'on_stage');
  const hasWaiting = queueItems.some((item) => item.status === 'waiting');

  if (promoteMissingStage && me.role === 'owner' && !hasOnStage && hasWaiting) {
    await promoteNextWaiting(room.id);
    queueItems = await listQueueItems(room.id);
  }

  const events = await listRoomEvents(room.id);
  members = await getRoomMembers(room.id);

  return {
    room,
    me,
    members,
    queueItems: enrichQueueItems(queueItems, members),
    events,
  };
}

export async function loadRoomSession({ roomId, user, promoteMissingStage = true }) {
  const room = await getRoom(roomId);
  return buildRoomSession({ room, user, promoteMissingStage });
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

  const { data: member, error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: room.id,
      user_id: user.id,
      name: userName.trim(),
      role: 'owner',
      status: 'active',
    })
    .select('*')
    .single();

  if (memberError) {
    throw new Error(`A sala foi criada, mas não foi possível adicionar você como dono: ${memberError.message}`);
  }

  const { error: queueError } = await supabase
    .from('queue_items')
    .insert({
      room_id: room.id,
      member_id: member.id,
      sort_order: 0,
      status: 'on_stage',
    });

  if (queueError) {
    throw new Error(`A sala foi criada, mas não foi possível iniciar a fila: ${queueError.message}`);
  }

  await createRoomEvent({ roomId: room.id, memberId: member.id, type: 'room_created' });

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
