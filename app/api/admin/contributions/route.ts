import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContributionInsert } from "@/types/database.types";

/**
 * GET: List all contributions (admin only)
 * Query params: member_id, contribution_type, start_date, end_date
 * POST: Record contribution (admin only)
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
    const memberId = searchParams.get("member_id");
    const contributionType = searchParams.get("contribution_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = admin
      .from("contributions")
      .select(`
        *,
        member:profiles!contributions_member_id_fkey(id, full_name, email),
        service:services(id, name, date),
        recorder:profiles!contributions_recorded_by_fkey(id, full_name, email)
      `)
      .order("contribution_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (memberId) {
      query = query.eq("member_id", memberId);
    }

    if (contributionType) {
      query = query.eq("contribution_type", contributionType);
    }

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
 * POST: Record contribution (admin only)
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
      member_id,
      contribution_type,
      amount,
      currency,
      payment_method,
      service_id,
      description,
      is_anonymous,
      contribution_date,
    } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

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

    const admin = createAdminClient();
    const { data: newContribution, error } = await admin
      .from("contributions")
      .insert({
        member_id: member_id.trim(),
        contribution_type,
        amount,
        currency: currency || "GBP",
        payment_method: payment_method || null,
        service_id: service_id || null,
        description: description?.trim() || null,
        is_anonymous: is_anonymous === true,
        recorded_by: user.id,
        contribution_date: contribution_date || new Date().toISOString().split("T")[0],
      } as ContributionInsert)
      .select(`
        *,
        member:profiles!contributions_member_id_fkey(id, full_name, email),
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

