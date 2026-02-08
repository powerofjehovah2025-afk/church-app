import { createClient } from "@/lib/supabase/client";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";

export interface FormConfigWithFields {
  formConfig: FormConfig;
  formFields: FormField[];
  staticContent: FormStaticContent[];
}

/**
 * Load form configuration from database
 */
export async function loadFormConfig(
  formType: "welcome" | "membership" | "newcomer"
): Promise<FormConfigWithFields | null> {
  try {
    const supabase = createClient();

    // Get form config
    const { data: formConfig, error: configError } = await supabase
      .from("form_configs")
      .select("*")
      .eq("form_type", formType)
      .eq("is_active", true)
      .single();

    if (configError || !formConfig) {
      console.error("Error loading form config:", configError);
      return null;
    }

    // Get form fields
    const { data: formFields, error: fieldsError } = await supabase
      .from("form_fields")
      .select("*")
      .eq("form_config_id", formConfig.id)
      .order("display_order", { ascending: true });

    if (fieldsError) {
      console.error("Error loading form fields:", fieldsError);
      return null;
    }

    // Get static content
    const { data: staticContent, error: contentError } = await supabase
      .from("form_static_content")
      .select("*")
      .eq("form_config_id", formConfig.id);

    if (contentError) {
      console.error("Error loading static content:", contentError);
      return null;
    }

    return {
      formConfig,
      formFields: formFields || [],
      staticContent: staticContent || [],
    };
  } catch (error) {
    console.error("Unexpected error loading form config:", error);
    return null;
  }
}

/**
 * Get static content by key
 */
export function getStaticContent(
  staticContent: FormStaticContent[],
  key: string
): string | null {
  const content = staticContent.find((c) => c.content_key === key);
  return content?.content || null;
}

/**
 * Group fields by section
 */
export function groupFieldsBySection(fields: FormField[]): Map<string, FormField[]> {
  const grouped = new Map<string, FormField[]>();
  
  fields.forEach((field) => {
    const section = field.section || "General";
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(field);
  });

  return grouped;
}

