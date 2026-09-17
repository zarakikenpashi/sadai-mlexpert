function requireValue(env, key) {
  const value = env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required Supabase environment variable: ${key}`);
  }
  return value.trim();
}

function requireUrl(env, key) {
  const value = requireValue(env, key);
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new Error(`Invalid Supabase URL in ${key}`);
  }
  return value;
}

export function validatePublicSupabaseEnv(env = process.env) {
  return {
    url: requireUrl(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireValue(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  };
}

export function validateServerSupabaseEnv(env = process.env) {
  return {
    url: requireUrl(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: requireValue(env, 'SUPABASE_SERVICE_ROLE_KEY')
  };
}
