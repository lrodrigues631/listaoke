import { supabase } from '../lib/supabaseClient';

export async function createRoomEvent({ roomId, type }) {
  const { error } = await supabase
    .from('room_events')
    .insert({
      room_id: roomId,
      type,
    });

  if (error) {
    throw new Error('A ação funcionou, mas não consegui registrar no histórico agora.');
  }
}

export async function listRoomEvents(roomId) {
  const { data, error } = await supabase
    .from('room_events')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Não consegui carregar o histórico da sala agora.');
  }

  return data || [];
}
