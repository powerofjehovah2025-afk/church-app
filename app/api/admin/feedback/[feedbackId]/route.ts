import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackUpdate } from "@/types/database.types";

/**
 * GET: Get single feedback item (admin only)
 * PUT: Update feedback status/notes (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
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

    const { feedbackId } = await params;
    const admin = createAdminClient();

    const { data: feedback, error } = await admin
      .from("feedback")
      .select(`
        *,
        submitter:profiles!feedback_submitted_by_fkey(id, full_name, email),
        reviewer:profiles!feedback_reviewed_by_fkey(id, full_name, email)
      `)
      .eq("id", feedbackId)
      .single();

    if (error || !feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ feedback });
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

/**
 * PUT: Update feedback (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
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

    const { feedbackId } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, admin_notes } = body;

    const updateData: FeedbackUpdate = {};

    if (status !== undefined) {
      if (!["pending", "reviewed", "resolved", "archived"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes?.trim() || null;
    }

    const admin = createAdminClient();
    const { data: updatedFeedback, error } = await admin
      .from("feedback")
      .update(updateData)
      .eq("id", feedbackId)
      .select(`
        *,
        submitter:profiles!feedback_submitted_by_fkey(id, full_name, email),
        reviewer:profiles!feedback_reviewed_by_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error updating feedback:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: updatedFeedback,
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

