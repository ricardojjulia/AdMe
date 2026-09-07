"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const authMode = (formData.get("authMode") as string) || "signin";
  const type = (formData.get("type") as string) || "individual";
  const company = formData.get("company") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();

  if (authMode === "signup") {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: type === "business" ? "business" : "consumer",
          full_name: type === "business" && company ? company : undefined,
        }
      }
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    if (signUpData.session) {
      revalidatePath("/", "layout");
      redirect(type === "business" ? "/studio" : "/onboarding");
    } else {
      return { success: "Account created! Please check your email to confirm registration or sign in." };
    }
  } else {
    // Explicit Sign In
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: signInError.message };
    }

    revalidatePath("/", "layout");
    redirect(type === "business" ? "/studio" : "/");
  }
}

export async function loginWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const type = (formData.get("type") as string) || "individual";

  if (!email) {
    return { error: "Please enter an email address for the magic link." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        account_type: type === "business" ? "business" : "consumer",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for the magic link!" };
}

