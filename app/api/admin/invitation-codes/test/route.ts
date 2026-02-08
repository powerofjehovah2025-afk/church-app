import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Test endpoint to diagnose invitation codes table issues
 */
export async function GET() {
  try {
    console.log("[TEST] Starting diagnostic test...");
    
    // Test 1: Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("[TEST] Environment:", { hasUrl, hasKey });
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        error: "Missing environment variables",
        hasUrl,
        hasKey,
      }, { status: 500 });
    }
    
    // Test 2: Create admin client
    let admin;
    try {
      admin = createAdminClient();
      console.log("[TEST] Admin client created");
    } catch (error) {
      return NextResponse.json({
        error: "Failed to create admin client",
        details: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }
    
    // Test 3: Try to query the table
    try {
      const { data, error } = await admin
        .from("invitation_codes")
        .select("id")
        .limit(1);
      
      console.log("[TEST] Query result:", { 
        hasError: !!error, 
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        dataCount: data?.length 
      });
      
      if (error) {
        return NextResponse.json({
          error: "Database query failed",
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: "Table exists and is accessible",
        dataCount: data?.length || 0,
      });
    } catch (queryError) {
      return NextResponse.json({
        error: "Query exception",
        details: queryError instanceof Error ? queryError.message : String(queryError),
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[TEST] Unexpected error:", error);
    return NextResponse.json({
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}


