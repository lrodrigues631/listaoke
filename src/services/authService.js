import { supabase } from '../lib/supabaseClient';

export async function ensureAnonymousSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error('Não consegui preparar sua entrada agora. Tenta de novo em alguns segundos.');
  }

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error('Não consegui criar sua entrada anônima. Tenta recarregar a página.');
  }

  if (!data.user) {
    throw new Error('Não consegui iniciar sua sessão. Tenta recarregar a página.');
  }

  return data.user;
}
