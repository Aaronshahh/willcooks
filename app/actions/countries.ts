"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Country {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CountryFormData {
  id?: string;
  name: string;
  description: string;
}

export interface CountryActionResult {
  success: boolean;
  error?: string;
}

export async function saveCountry(
  formData: CountryFormData
): Promise<CountryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const record = {
    name: formData.name.trim(),
    description: formData.description.trim(),
  };

  if (formData.id) {
    const { error } = await supabase
      .from("countries")
      .update(record)
      .eq("id", formData.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("countries").insert(record);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin/countries");
  return { success: true };
}

export async function deleteCountry(
  id: string
): Promise<CountryActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase.from("countries").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/countries");
  return { success: true };
}
