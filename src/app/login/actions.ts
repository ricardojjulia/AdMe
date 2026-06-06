"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const type = formData.get("type") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If sign in fails, attempt sign up (simplified flow for demo purposes)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: type,
        }
      }
    });

    if (signUpError) {
      console.error(signUpError);
      return { error: signUpError.message };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400'}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { success: "Check your email for the magic link!" };
}
