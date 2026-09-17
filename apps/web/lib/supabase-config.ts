type EnvLike = Record<string, string | undefined>;

function requireValue(env: EnvLike, key: string): string {
  const value = env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required Supabase environment variable: ${key}`);
  }
  return value.trim();
}

function requireUrl(env: EnvLike, key: string): string {
  const value = requireValue(env, key);
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new Error(`Invalid Supabase URL in ${key}`);
  }
  return value;
}

export type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

export type ServerSupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

export function validatePublicSupabaseEnv(env: EnvLike = process.env): PublicSupabaseEnv {
  return {
    url: requireUrl(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireValue(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  };
}

export function validateServerSupabaseEnv(env: EnvLike = process.env): ServerSupabaseEnv {
  return {
    url: requireUrl(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: requireValue(env, 'SUPABASE_SERVICE_ROLE_KEY')
  };
}
