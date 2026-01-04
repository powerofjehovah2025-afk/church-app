import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Google OAuth Callback Route
 * Handles the OAuth callback from Google, exchanges the code for a session,
 * fetches the user's role, and redirects to the appropriate dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors from provider
  if (error) {
    console.error("OAuth provider error:", error, errorDescription);
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", "No authorization code provided");
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();

  try {
    // Exchange the code for a session
    const { data: { session }, error: oauthError } = await supabase.auth.exchangeCodeForSession(code);

    if (oauthError) {
      console.error("OAuth exchange error:", oauthError);
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", oauthError.message || "Failed to authenticate with Google");
      return NextResponse.redirect(errorUrl);
    }

    // Validate session exists and has user
    if (!session) {
      console.error("No session after OAuth exchange");
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "Failed to create session");
      return NextResponse.redirect(errorUrl);
    }

    if (!session.user) {
      console.error("No user in session after OAuth exchange");
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "No user data received from Google");
      return NextResponse.redirect(errorUrl);
    }

    // Verify session is valid by checking access token
    if (!session.access_token) {
      console.error("No access token in session");
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "Invalid session: missing access token");
      return NextResponse.redirect(errorUrl);
    }

    // Wait a moment to ensure session is fully established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify session is still valid
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser();
    
    if (verifyError || !verifiedUser || verifiedUser.id !== session.user.id) {
      console.error("Session verification failed:", verifyError);
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "Session verification failed");
      return NextResponse.redirect(errorUrl);
    }

    // Check if profile exists first
    let profile = null;
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected for new users
      console.error("Error fetching profile:", fetchError);
      // Continue to try creating the profile
    } else if (existingProfile) {
      profile = existingProfile;
    }

    // Create profile if it doesn't exist (RLS policies now allow this)
    if (!profile) {
      // Extract name from user_metadata or email
      const fullName = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name ||
                      session.user.email?.split("@")[0] || 
                      null;

      const profileData = {
        id: session.user.id,
        email: session.user.email || null,
        full_name: fullName,
        role: "member", // Default role
      };

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        // @ts-expect-error - Supabase type inference issue, but this works at runtime
        .insert(profileData)
        .select("id, role")
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        
        // Check if it's a duplicate key error (profile was created by another process/race condition)
        if (profileError.code === "23505") {
          // Profile already exists, fetch it
          const { data: retryProfile } = await supabase
            .from("profiles")
            .select("id, role")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (retryProfile) {
            profile = retryProfile;
          } else {
            const errorUrl = new URL("/auth/error", request.url);
            errorUrl.searchParams.set("error", "Profile creation failed. Please try again.");
            return NextResponse.redirect(errorUrl);
          }
        } else {
          // Other error - log details for debugging
          console.error("Profile creation error details:", {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          });
          
          const errorUrl = new URL("/auth/error", request.url);
          errorUrl.searchParams.set("error", `Failed to create user profile: ${profileError.message || "Unknown error"}`);
          return NextResponse.redirect(errorUrl);
        }
      } else if (newProfile) {
        profile = newProfile;
      }
    }

    // Ensure we have a profile at this point
    if (!profile) {
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "Unable to retrieve or create user profile");
      return NextResponse.redirect(errorUrl);
    }

    // Get user role from profile
    const userRole = profile ? (profile as { role?: string | null }).role : null;

    // Determine redirect URL based on role
    let redirectPath = "/dashboard"; // Default to member dashboard
    if (userRole === "admin") {
      redirectPath = "/admin/newcomers";
    }

    // Use NextResponse.redirect with absolute URL to avoid NEXT_REDIRECT error
    const redirectUrl = new URL(redirectPath, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error in OAuth callback:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", errorMessage);
    return NextResponse.redirect(errorUrl);
  }
}

