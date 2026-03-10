"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubscribeResult {
  success: boolean;
  alreadySubscribed?: boolean;
  error?: string;
}

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const trimmed = email.trim().toLowerCase();

  // Basic format check server-side
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("subscribers")
    .insert({ email: trimmed });

  if (error) {
    // Postgres unique-violation code
    if (error.code === "23505") {
      return { success: true, alreadySubscribed: true };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}
