import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormConfigInsert } from "@/types/database.types";

/**
 * GET: List all form configs (admin only)
 * POST: Create a new form config (admin only)
 */
export async function GET() {
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

    // Check if user is admin
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
    const { data: formConfigs, error } = await admin
      .from("form_configs")
      .select("*")
      .order("form_type", { ascending: true });

    if (error) {
      console.error("Error fetching form configs:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ formConfigs: formConfigs || [] });
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
 * POST: Create a new form config (admin only)
 */
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
    const { form_type, title, description, is_active } = body;

    if (!form_type || typeof form_type !== "string") {
      return NextResponse.json(
        { error: "Form type is required" },
        { status: 400 }
      );
    }

    if (!["welcome", "membership", "newcomer"].includes(form_type)) {
      return NextResponse.json(
        { error: "Invalid form type. Must be 'welcome', 'membership', or 'newcomer'" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newFormConfig, error } = await admin
      .from("form_configs")
      .insert({
        form_type: form_type.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      } as FormConfigInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating form config:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      formConfig: newFormConfig,
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

