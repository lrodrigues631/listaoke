import { supabase } from '../lib/supabaseClient';

export async function ensureAnonymousSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Não foi possível verificar sua sessão: ${sessionError.message}`);
  }

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error(`Não foi possível entrar anonimamente: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Não foi possível iniciar uma sessão anônima.');
  }

  return data.user;
}
