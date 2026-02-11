import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackInsert } from "@/types/database.types";

/**
 * GET: List feedback submitted by the current user
 * POST: Submit new feedback (member only)
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

    const { searchParams } = new URL(request.url);
    const feedbackType = searchParams.get("feedback_type");
    const status = searchParams.get("status");

    let query = supabase
      .from("feedback")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });

    if (feedbackType) {
      query = query.eq("feedback_type", feedbackType);
    }

    if (status) {
      query = query.eq("status", status);
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

/**
 * POST: Submit new feedback (member only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const {
      feedback_type,
      related_id,
      title,
      content,
      rating,
      is_anonymous,
    } = body;

    if (!feedback_type || !["service", "event", "general"].includes(feedback_type)) {
      return NextResponse.json(
        { error: "Valid feedback_type is required (service, event, or general)" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { data: newFeedback, error } = await supabase
      .from("feedback")
      .insert({
        submitted_by: user.id,
        feedback_type,
        related_id: related_id || null,
        title: title.trim(),
        content: content.trim(),
        rating: rating || null,
        is_anonymous: is_anonymous === true,
        status: "pending",
      } as FeedbackInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating feedback:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: newFeedback,
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

