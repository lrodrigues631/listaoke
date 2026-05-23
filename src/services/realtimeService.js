import { supabase } from '../lib/supabaseClient';

export function subscribeToRoomChanges({ roomId, onChange }) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rooms',
      filter: `id=eq.${roomId}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'room_members',
      filter: `room_id=eq.${roomId}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'queue_items',
      filter: `room_id=eq.${roomId}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'room_events',
      filter: `room_id=eq.${roomId}`,
    }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
