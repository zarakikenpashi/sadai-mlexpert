import { createClient } from '@supabase/supabase-js';
import { validatePublicSupabaseEnv, validateServerSupabaseEnv } from './supabase-config.mjs';

export function createBrowserSupabaseClient(env = process.env) {
  const { url, anonKey } = validatePublicSupabaseEnv(env);
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}

export function createServiceRoleSupabaseClient(env = process.env) {
  if (typeof window !== 'undefined') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must never be used in the browser');
  }

  const { url, serviceRoleKey } = validateServerSupabaseEnv(env);
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
