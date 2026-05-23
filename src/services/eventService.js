import { supabase } from '../lib/supabaseClient';

export async function createRoomEvent({ roomId, type }) {
  const { error } = await supabase
    .from('room_events')
    .insert({
      room_id: roomId,
      type,
    });

  if (error) {
    throw new Error(`Não foi possível registrar o evento da sala: ${error.message}`);
  }
}

export async function listRoomEvents(roomId) {
  const { data, error } = await supabase
    .from('room_events')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Não foi possível carregar o histórico da sala: ${error.message}`);
  }

  return data || [];
}
