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
    throw new Error('Não consegui carregar essa sala agora. Tenta de novo em alguns segundos.');
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
    throw new Error('Não consegui atualizar a lista de pessoas da sala agora.');
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
    throw new Error('Não encontrei sua participação nessa sala. Tente entrar de novo pelo código.');
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

export async function transferRoomOwnership({ roomId, newOwnerMemberId }) {
  const { error } = await supabase.rpc('transfer_room_ownership', {
    p_room_id: roomId,
    p_new_owner_member_id: newOwnerMemberId,
  });

  if (error) {
    throw new Error('Não consegui transferir a sala. Confere se você ainda é o dono e tenta de novo.');
  }
}

export async function closeRoom({ roomId, userId }) {
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by_user_id: userId,
    })
    .eq('id', roomId);

  if (error) {
    throw new Error('Não consegui fechar a sala agora. Tenta de novo em alguns segundos.');
  }

  await createRoomEvent({ roomId, type: 'room_closed' });
}

export async function createRoom({ name, userName, user }) {
  const { data: code, error: codeError } = await supabase.rpc('generate_room_code');

  if (codeError) {
    throw new Error('Não consegui gerar o código da sala agora. Tenta de novo em alguns segundos.');
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
    throw new Error('Não consegui criar a sala agora. Tenta de novo em alguns segundos.');
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
    throw new Error('A sala nasceu, mas não consegui colocar você como dono. Tenta criar outra sala.');
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
    throw new Error('A sala nasceu, mas não consegui iniciar a fila. Tenta criar outra sala.');
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
    throw new Error('Não consegui procurar essa sala agora. Tenta de novo em alguns segundos.');
  }

  if (!room) {
    throw new Error('Não encontrei essa sala. Confere o código e tenta de novo.');
  }

  if (room.status === 'closed') {
    throw new Error('Essa sala já foi encerrada. O karaokê dessa turma acabou por hoje.');
  }

  const { data: existingMember, error: memberLookupError } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberLookupError) {
    throw new Error('Não consegui conferir sua entrada nessa sala agora.');
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
      throw new Error('Não consegui reativar sua entrada na sala. Tenta de novo.');
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
      throw new Error('Não consegui te colocar na sala agora. Tenta de novo em alguns segundos.');
    }
  }

  return buildRoomSession({ room, user });
}
