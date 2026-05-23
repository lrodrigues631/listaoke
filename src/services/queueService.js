import { supabase } from '../lib/supabaseClient';
import { createRoomEvent } from './eventService';

const ACTIVE_STATUSES = ['on_stage', 'waiting'];

function sortByOrder(items) {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function getNextSortOrder(items) {
  const activeOrders = items
    .filter((item) => ACTIVE_STATUSES.includes(item.status))
    .map((item) => item.sort_order ?? 0);

  return activeOrders.length ? Math.max(...activeOrders) + 1 : 0;
}

export async function listQueueItems(roomId) {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Não foi possível carregar a fila: ${error.message}`);
  }

  return data || [];
}

export async function addMemberToQueue({ roomId, memberId }) {
  const items = await listQueueItems(roomId);
  const activeItems = items.filter((item) => ACTIVE_STATUSES.includes(item.status));
  const alreadyActive = activeItems.some((item) => item.member_id === memberId);

  if (alreadyActive) {
    throw new Error('Você já está na fila ou cantando agora.');
  }

  const hasOnStage = activeItems.some((item) => item.status === 'on_stage');
  const status = hasOnStage ? 'waiting' : 'on_stage';

  const { error } = await supabase
    .from('queue_items')
    .insert({
      room_id: roomId,
      member_id: memberId,
      sort_order: getNextSortOrder(items),
      status,
    });

  if (error) {
    throw new Error(`Não foi possível entrar na fila: ${error.message}`);
  }

  await createRoomEvent({ roomId, memberId, type: 'member_added_to_queue' });
}

export async function promoteNextWaiting(roomId) {
  const items = await listQueueItems(roomId);
  const hasOnStage = items.some((item) => item.status === 'on_stage');
  if (hasOnStage) return null;

  const nextWaiting = sortByOrder(items.filter((item) => item.status === 'waiting'))[0];
  if (!nextWaiting) return null;

  const { error } = await supabase
    .from('queue_items')
    .update({ status: 'on_stage', sort_order: 0 })
    .eq('id', nextWaiting.id);

  if (error) {
    throw new Error(`Não foi possível promover o próximo participante: ${error.message}`);
  }

  return nextWaiting.id;
}

export async function removeQueueItem({ roomId, queueItem, actorMemberId, isOwner }) {
  if (!isOwner && queueItem.member_id !== actorMemberId) {
    throw new Error('Você só pode sair da sua própria vez.');
  }

  const wasOnStage = queueItem.status === 'on_stage';
  const { error } = await supabase
    .from('queue_items')
    .update({ status: 'removed' })
    .eq('id', queueItem.id);

  if (error) {
    throw new Error(`Não foi possível remover da fila: ${error.message}`);
  }

  await createRoomEvent({
    roomId,
    memberId: queueItem.member_id,
    type: isOwner && queueItem.member_id !== actorMemberId ? 'member_removed' : 'member_left_queue',
  });

  if (wasOnStage) {
    await promoteNextWaiting(roomId);
  }
}

export async function skipQueueItem({ roomId, queueItem, actorMemberId, isOwner }) {
  if (!isOwner && queueItem.member_id !== actorMemberId) {
    throw new Error('Você só pode passar a própria vez.');
  }

  const items = await listQueueItems(roomId);
  const nextOrder = getNextSortOrder(items);

  const { error } = await supabase
    .from('queue_items')
    .update({
      status: 'waiting',
      sort_order: nextOrder,
    })
    .eq('id', queueItem.id);

  if (error) {
    throw new Error(`Não foi possível passar a vez: ${error.message}`);
  }

  await createRoomEvent({ roomId, memberId: queueItem.member_id, type: 'member_skipped_turn' });

  if (queueItem.status === 'on_stage') {
    await promoteNextWaiting(roomId);
  }
}

export async function finishCurrentPerformance({ roomId, queueItem }) {
  const items = await listQueueItems(roomId);
  const nextOrder = getNextSortOrder(items);

  const { error: finishError } = await supabase
    .from('queue_items')
    .update({ status: 'done' })
    .eq('id', queueItem.id);

  if (finishError) {
    throw new Error(`Não foi possível concluir a apresentação: ${finishError.message}`);
  }

  await createRoomEvent({ roomId, memberId: queueItem.member_id, type: 'performance_finished' });

  const waitingItems = items.filter((item) => item.status === 'waiting');
  const shouldReturnOnStage = waitingItems.length === 0;

  const { error: requeueError } = await supabase
    .from('queue_items')
    .insert({
      room_id: roomId,
      member_id: queueItem.member_id,
      sort_order: nextOrder,
      status: shouldReturnOnStage ? 'on_stage' : 'waiting',
    });

  if (requeueError) {
    throw new Error(`Não foi possível recolocar o participante na fila: ${requeueError.message}`);
  }

  if (!shouldReturnOnStage) {
    await promoteNextWaiting(roomId);
  }
}

export async function reorderWaitingQueue({ roomId, waitingItems, actorMemberId }) {
  const updates = waitingItems.map((item, index) => (
    supabase
      .from('queue_items')
      .update({ sort_order: index + 1 })
      .eq('id', item.id)
  ));

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed) {
    throw new Error(`Não foi possível reordenar a fila: ${failed.error.message}`);
  }

  await createRoomEvent({ roomId, memberId: actorMemberId, type: 'queue_reordered' });
}
