import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: List all invitation codes (admin only)
 * POST: Create a new invitation code (admin only)
 */
export async function GET() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:9',message:'GET handler entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:17',message:'Auth check result',data:{hasUser:!!user,userId:user?.id,userError:userError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (userError || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:20',message:'Returning 401 Unauthorized',data:{userError:userError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:31',message:'Profile check result',data:{hasProfile:!!profile,role:profile?.role,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (profile?.role !== "admin") {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:34',message:'Returning 403 Forbidden',data:{role:profile?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Fetch all invitation codes with creator info
    console.log("[DEBUG] Creating admin client...");
    console.log("[DEBUG] Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    
    let admin;
    try {
      admin = createAdminClient();
      console.log("[DEBUG] Admin client created successfully");
    } catch (adminError) {
      console.error("[ERROR] Failed to create admin client:", adminError);
      return NextResponse.json(
        { error: "Server configuration error. Please check environment variables." },
        { status: 500 }
      );
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:40',message:'Before database query',data:{hasAdminClient:!!admin},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // First, try to fetch codes without the relationship to see if basic query works
    console.log("[DEBUG] Fetching invitation codes from database...");
    const { data: codes, error } = await admin
      .from("invitation_codes")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("[DEBUG] Query result:", { 
      hasError: !!error, 
      errorMessage: error?.message, 
      errorCode: error?.code,
      errorDetails: error?.details,
      codesCount: codes?.length 
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:48',message:'Database query result',data:{hasError:!!error,errorMessage:error?.message,errorCode:error?.code,errorDetails:error?.details,codesCount:codes?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error("[ERROR] Error fetching invitation codes:", error);
      console.error("[ERROR] Full error object:", JSON.stringify(error, null, 2));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:52',message:'Returning 500 error',data:{errorMessage:error.message,errorCode:error.code,errorDetails:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: error.message || "Failed to fetch invitation codes" },
        { status: 500 }
      );
    }

    // If we have codes, fetch creator info separately
    if (codes && codes.length > 0) {
      const creatorIds = [...new Set(codes.map((c: { created_by: string }) => c.created_by))];
      const { data: creators } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", creatorIds);
      
      // Map creators to codes
      const codesWithCreators = codes.map((code: any) => ({
        ...code,
        creator: creators?.find((c: { id: string }) => c.id === code.created_by) || null,
      }));
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:66',message:'Mapped codes with creators',data:{codesCount:codesWithCreators.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json({ codes: codesWithCreators });
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:75',message:'Returning success - no codes or empty',data:{codesCount:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ codes: [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f7dee51-1168-41d3-a81f-2777c65ab77d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/invitation-codes/route.ts:60',message:'Catch block - unexpected error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      code,
      expiresAt,
      maxUses,
    } = body;

    // Generate code if not provided
    let finalCode = code?.trim().toUpperCase();
    if (!finalCode) {
      // Generate a random 8-character code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      finalCode = "";
      for (let i = 0; i < 8; i++) {
        finalCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Validate code format (alphanumeric, 4-20 characters)
    if (!/^[A-Z0-9]{4,20}$/.test(finalCode)) {
      return NextResponse.json(
        { error: "Code must be 4-20 alphanumeric characters" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    
    // Check if code already exists
    const { data: existing } = await admin
      .from("invitation_codes")
      .select("id")
      .eq("code", finalCode)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This code already exists. Please use a different code." },
        { status: 400 }
      );
    }

    // Create the invitation code
    const { data: newCode, error } = await admin
      .from("invitation_codes")
      .insert({
        code: finalCode,
        created_by: user.id,
        expires_at: expiresAt || null,
        max_uses: maxUses || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invitation code:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: newCode,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

