import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import type { ProfileInsert } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");

  const supabase = await createClient();

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { data: { session }, error: oauthError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (oauthError) {
      redirect(`/auth/error?error=${oauthError.message || "OAuth authentication failed"}`);
    }

    if (session?.user) {
      // Ensure profile exists after OAuth authentication
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        // Extract name from user_metadata or email
        const fullName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name ||
                        session.user.email?.split("@")[0] || 
                        null;

        const { error: profileError } = await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference issue, but this works at runtime
          .insert({
            id: session.user.id,
            email: session.user.email || null,
            full_name: fullName,
            role: "member", // Default role
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          redirect(`/auth/error?error=Failed to create user profile`);
        }
      }

      // Redirect based on role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const userRole = profile ? (profile as { role?: string | null }).role : null;
      if (userRole === "admin") {
        redirect("/admin/newcomers");
      } else {
        redirect(next || "/dashboard");
      }
    }
  }

  // Handle email OTP verification
  if (token_hash && type) {
    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error && data.user) {
      // Ensure profile exists after email confirmation
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference issue, but this works at runtime
          .insert({
            id: data.user.id,
            email: data.user.email || null,
            full_name: data.user.user_metadata?.full_name || null,
            role: "member", // Default role
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          redirect(`/auth/error?error=Failed to create user profile`);
        }
      }

      // Redirect based on role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const userRole = profile ? (profile as { role?: string | null }).role : null;
      if (userRole === "admin") {
        redirect("/admin/newcomers");
      } else {
        redirect(next || "/dashboard");
      }
    } else {
      redirect(`/auth/error?error=${error?.message || "Verification failed"}`);
    }
  }

  // If no code or token_hash, redirect to error
  redirect(`/auth/error?error=No authentication token provided`);
}
