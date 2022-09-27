const clientEnvVars = {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};
const serverEnvVars = {
  ...clientEnvVars,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  dbpass: process.env.SUPABASE_DATABASE_PASSWORD!,
};

export type SupabaseClientConfig = typeof clientEnvVars;
export type SupabaseServerConfig = typeof serverEnvVars;

export function getSupabaseClientConfig() {
  return validate(clientEnvVars);
}

export function getSupabaseServerConfig() {
  return validate(serverEnvVars);
}

function validate<T extends Record<string, string>>(vars: T) {
  const enabled = Object.values(vars).some((v) => v);
  if (!enabled) {
    return undefined;
  }
  for (const [k, v] of Object.entries(vars)) {
    if (!v) {
      throw new Error(
        `Invalid Supabase config: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_DATABASE_PASSWORD must be set (${k} was not)`
      );
    }
  }
  return vars;
}
