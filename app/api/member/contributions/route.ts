import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContributionInsert } from "@/types/database.types";

/**
 * GET: Get current user's contributions
 * POST: Record own contribution (member only)
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
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("contributions")
      .select(`
        *,
        service:services(id, name, date)
      `)
      .eq("member_id", user.id)
      .order("contribution_date", { ascending: false });

    if (startDate) {
      query = query.gte("contribution_date", startDate);
    }

    if (endDate) {
      query = query.lte("contribution_date", endDate);
    }

    const { data: contributions, error } = await query;

    if (error) {
      console.error("Error fetching contributions:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contributions: contributions || [] });
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
 * POST: Record own contribution (member only)
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
      contribution_type,
      amount,
      currency,
      payment_method,
      service_id,
      description,
      is_anonymous,
      contribution_date,
    } = body;

    if (!contribution_type || !["tithe", "offering", "donation", "special"].includes(contribution_type)) {
      return NextResponse.json(
        { error: "Valid contribution_type is required" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const { data: newContribution, error } = await supabase
      .from("contributions")
      .insert({
        member_id: user.id,
        contribution_type,
        amount,
        currency: currency || "GBP",
        payment_method: payment_method || null,
        service_id: service_id || null,
        description: description?.trim() || null,
        is_anonymous: is_anonymous === true,
        contribution_date: contribution_date || new Date().toISOString().split("T")[0],
      } as ContributionInsert)
      .select(`
        *,
        service:services(id, name, date)
      `)
      .single();

    if (error) {
      console.error("Error recording contribution:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contribution: newContribution,
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

