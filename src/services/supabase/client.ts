import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getMissingSupabaseConfigMessage, getSupabaseConfig } from "./config";
import type { Database } from "../../types/supabase";

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(getMissingSupabaseConfigMessage());
  }

  client = createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: AsyncStorage,
    },
  });

  return client;
}
