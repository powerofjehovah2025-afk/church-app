import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * API endpoint to record invitation code usage
 * This is called after a user successfully signs up
 * Uses admin client to bypass RLS and update usage count
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { codeId, userId } = body;

    if (!codeId || !userId) {
      return NextResponse.json(
        { error: "Code ID and User ID are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Record usage in invitation_code_usage table
    const { error: usageError } = await admin
      .from("invitation_code_usage")
      .insert({
        code_id: codeId,
        used_by: userId,
      });

    if (usageError) {
      // If it's a duplicate, that's okay (user might have already been recorded)
      if (usageError.code !== "23505") {
        console.error("Error recording code usage:", usageError);
        return NextResponse.json(
          { error: usageError.message },
          { status: 500 }
        );
      }
    }

    // Increment used_count in invitation_codes table
    const { error: updateError } = await admin.rpc("increment_code_usage", {
      code_id: codeId,
    }).catch(async () => {
      // If RPC doesn't exist, do manual update
      const { data: code } = await admin
        .from("invitation_codes")
        .select("used_count")
        .eq("id", codeId)
        .single();

      if (code) {
        return await admin
          .from("invitation_codes")
          .update({ used_count: (code.used_count || 0) + 1 })
          .eq("id", codeId);
      }
    });

    if (updateError) {
      console.error("Error incrementing code usage:", updateError);
      // Don't fail - usage was recorded
    }

    return NextResponse.json({ success: true });
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

