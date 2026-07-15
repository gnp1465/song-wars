import { getSupabaseClient } from "../supabase/client";

export interface AnonymousSessionResult {
  userId: string;
}

export async function restoreOrCreateAnonymousSession(): Promise<AnonymousSessionResult> {
  const supabase = getSupabaseClient();
  const existingSession = await supabase.auth.getSession();
  const existingUserId = existingSession.data.session?.user.id;

  if (existingUserId) {
    return {
      userId: existingUserId,
    };
  }

  const result = await supabase.auth.signInAnonymously();

  if (result.error) {
    throw result.error;
  }

  const userId = result.data.user?.id;

  if (!userId) {
    throw new Error("Anonymous sign-in did not return a user.");
  }

  return {
    userId,
  };
}
