import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormSubmissionRuleInsert, FormSubmissionRuleUpdate } from "@/types/database.types";

/**
 * GET: List all submission rules for a form (admin only)
 * POST: Create or update a submission rule (admin only)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;
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

    // Get form config to find form_config_id
    const { data: formConfig } = await admin
      .from("form_configs")
      .select("id")
      .eq("form_type", formType)
      .eq("status", "published")
      .single();

    if (!formConfig) {
      // Fallback to latest version
      const { data: latestConfig } = await admin
        .from("form_configs")
        .select("id")
        .eq("form_type", formType)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (!latestConfig) {
        return NextResponse.json({ rules: [] });
      }

      const { data: rules, error } = await admin
        .from("form_submission_rules")
        .select("*")
        .eq("form_config_id", latestConfig.id)
        .order("priority", { ascending: true });

      if (error) {
        console.error("Error fetching rules:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ rules: rules || [] });
    }

    const { data: rules, error } = await admin
      .from("form_submission_rules")
      .select("*")
      .eq("form_config_id", formConfig.id)
      .order("priority", { ascending: true });

    if (error) {
      console.error("Error fetching rules:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules: rules || [] });
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
 * POST: Create or update a submission rule (admin only)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;
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
    const { id, form_config_id, rule_type, rule_config, priority } = body;

    if (!rule_type || !rule_config) {
      return NextResponse.json(
        { error: "Rule type and rule config are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get form config if form_config_id not provided
    let targetFormConfigId = form_config_id;
    if (!targetFormConfigId) {
      const { data: formConfig } = await admin
        .from("form_configs")
        .select("id")
        .eq("form_type", formType)
        .eq("status", "published")
        .single();

      if (!formConfig) {
        const { data: latestConfig } = await admin
          .from("form_configs")
          .select("id")
          .eq("form_type", formType)
          .order("version", { ascending: false })
          .limit(1)
          .single();

        if (!latestConfig) {
          return NextResponse.json(
            { error: "Form config not found" },
            { status: 404 }
          );
        }
        targetFormConfigId = latestConfig.id;
      } else {
        targetFormConfigId = formConfig.id;
      }
    }

    if (id) {
      // Update existing rule
      const updateData: FormSubmissionRuleUpdate = {
        rule_type,
        rule_config,
        priority: priority !== undefined ? Number(priority) : undefined,
      };

      const { data: updatedRule, error } = await admin
        .from("form_submission_rules")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating rule:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, rule: updatedRule });
    } else {
      // Create new rule
      const insertData: FormSubmissionRuleInsert = {
        form_config_id: targetFormConfigId,
        rule_type,
        rule_config,
        priority: priority !== undefined ? Number(priority) : 0,
      };

      const { data: newRule, error } = await admin
        .from("form_submission_rules")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating rule:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, rule: newRule });
    }
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

