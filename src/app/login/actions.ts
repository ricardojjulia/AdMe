"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "");
    const emailRedirectTo = origin
      ? `${origin}/auth/callback?next=${type === "business" ? "/studio" : "/onboarding"}`
      : undefined;

    let userCreated = false;

    // Use service role admin API if available to auto-confirm and bypass SMTP rate limits
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const adminSupabase = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: adminCreated, error: adminError } = await adminSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            account_type: type === "business" ? "business" : "consumer",
            full_name: type === "business" && company ? company : undefined,
          }
        });

        if (!adminError && adminCreated.user) {
          userCreated = true;
        } else if (adminError && adminError.message?.toLowerCase().includes("already registered")) {
          return { error: "An account with this email is already registered. Please switch to 'Sign In'!" };
        }
      } catch (adminErr) {
        console.warn("Admin create fallback to standard signUp:", adminErr);
      }
    }

    if (!userCreated) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            account_type: type === "business" ? "business" : "consumer",
            full_name: type === "business" && company ? company : undefined,
          }
        }
      });

      if (signUpError) {
        return { error: signUpError.message };
      }
    }

    // Immediately sign in the newly registered user to establish session cookies
    const { error: autoSignInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!autoSignInError) {
      revalidatePath("/", "layout");
      return { success: true, redirectTo: type === "business" ? "/studio" : "/onboarding" };
    }

    return { success: "Account created! You can now sign in with your credentials." };
  } else {
    // Explicit Sign In
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message?.toLowerCase().includes("invalid login credentials")) {
        return { 
          error: "Invalid email or password. If you don't have an account yet, click 'Create Account' above to sign up!" 
        };
      }
      return { error: signInError.message };
    }

    revalidatePath("/", "layout");
    return { success: true, redirectTo: type === "business" ? "/studio" : "/" };
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

