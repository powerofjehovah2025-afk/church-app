import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST: Create or update static content for a form (admin only).
 * Body: { content_key: string, content: string, content_type?: string }
 * Uses the published form config for the given formType (or latest if none published).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;

    if (!formType || !["welcome", "membership"].includes(formType)) {
      return NextResponse.json(
        { error: "Invalid form type. Must be welcome or membership." },
        { status: 400 }
      );
    }

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
    const { content_key, content, content_type } = body;

    if (!content_key || typeof content_key !== "string" || !content_key.trim()) {
      return NextResponse.json(
        { error: "content_key is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get published form config (or latest)
    const { data: formConfigs, error: configError } = await admin
      .from("form_configs")
      .select("id, status")
      .eq("form_type", formType)
      .order("version", { ascending: false });

    if (configError || !formConfigs?.length) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 }
      );
    }

    const published = formConfigs.find((fc) => fc.status === "published");
    const formConfigId = (published || formConfigs[0]).id;

    const contentValue = typeof content === "string" ? content : "";
    const contentType = typeof content_type === "string" && content_type.trim() ? content_type.trim() : "text";

    // Find existing row for this form_config_id + content_key
    const { data: existing, error: findError } = await admin
      .from("form_static_content")
      .select("id")
      .eq("form_config_id", formConfigId)
      .eq("content_key", content_key.trim())
      .maybeSingle();

    if (findError) {
      console.error("Error finding static content:", findError);
      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    if (existing) {
      const { error: updateError } = await admin
        .from("form_static_content")
        .update({
          content: contentValue,
          content_type: contentType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating static content:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await admin
        .from("form_static_content")
        .insert({
          form_config_id: formConfigId,
          content_key: content_key.trim(),
          content: contentValue,
          content_type: contentType,
        });

      if (insertError) {
        console.error("Error inserting static content:", insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/forms/[formType]/content:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
