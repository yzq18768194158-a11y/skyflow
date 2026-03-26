const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

interface SupabaseAuthUser {
  id: string;
  email?: string;
}

export function assertSupabaseServerAuthConfig() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase server auth is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
}

export async function verifySupabaseAccessToken(accessToken: string): Promise<AuthenticatedUser> {
  assertSupabaseServerAuthConfig();

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseServiceRoleKey!,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Invalid or expired Supabase access token.');
  }

  const user = (await response.json()) as SupabaseAuthUser;
  return {
    id: user.id,
    email: user.email,
  };
}
