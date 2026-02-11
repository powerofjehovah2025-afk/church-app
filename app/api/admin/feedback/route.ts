import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackUpdate } from "@/types/database.types";

/**
 * GET: List all feedback (admin only)
 * Query params: feedback_type, status, start_date, end_date
 */
export async function GET(request: NextRequest) {
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

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const feedbackType = searchParams.get("feedback_type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = admin
      .from("feedback")
      .select(`
        *,
        submitter:profiles!feedback_submitted_by_fkey(id, full_name, email),
        reviewer:profiles!feedback_reviewed_by_fkey(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (feedbackType) {
      query = query.eq("feedback_type", feedbackType);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error("Error fetching feedback:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: feedback || [] });
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

