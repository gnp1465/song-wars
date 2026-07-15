declare const process: {
  env?: Record<string, string | undefined>;
};

export interface SupabaseConfig {
  anonKey: string;
  url: string;
}

export function getSupabaseConfig(): SupabaseConfig | undefined {
  const url = process.env?.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return undefined;
  }

  return {
    anonKey,
    url,
  };
}

export function getMissingSupabaseConfigMessage(): string {
  return "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to run online rooms.";
}
