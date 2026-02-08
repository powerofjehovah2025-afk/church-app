import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormStaticContentInsert, FormStaticContentUpdate } from "@/types/database.types";

/**
 * GET: Get all static content for a form (admin only)
 * POST: Create or update static content (admin only)
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
    
    // Get form config first
    const { data: formConfig } = await admin
      .from("form_configs")
      .select("id")
      .eq("form_type", formType)
      .single();

    if (!formConfig) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 }
      );
    }

    // Get static content
    const { data: staticContent, error } = await admin
      .from("form_static_content")
      .select("*")
      .eq("form_config_id", formConfig.id);

    if (error) {
      console.error("Error fetching static content:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ staticContent: staticContent || [] });
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
 * POST: Create or update static content (admin only)
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
    const { content_key, content, content_type } = body;

    if (!content_key || typeof content_key !== "string") {
      return NextResponse.json(
        { error: "Content key is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    
    // Get form config
    const { data: formConfig } = await admin
      .from("form_configs")
      .select("id")
      .eq("form_type", formType)
      .single();

    if (!formConfig) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 }
      );
    }

    // Check if content already exists
    const { data: existingContent } = await admin
      .from("form_static_content")
      .select("id")
      .eq("form_config_id", formConfig.id)
      .eq("content_key", content_key)
      .single();

    if (existingContent) {
      // Update existing content
      const updateData: FormStaticContentUpdate = {
        content: content.trim(),
      };
      if (content_type !== undefined) {
        updateData.content_type = content_type;
      }

      const { data: updatedContent, error } = await admin
        .from("form_static_content")
        .update(updateData)
        .eq("id", existingContent.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating static content:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        staticContent: updatedContent,
      });
    }

    // Create new content
    const { data: newContent, error } = await admin
      .from("form_static_content")
      .insert({
        form_config_id: formConfig.id,
        content_key: content_key.trim(),
        content: content.trim(),
        content_type: content_type || "text",
      } as FormStaticContentInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating static content:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staticContent: newContent,
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

