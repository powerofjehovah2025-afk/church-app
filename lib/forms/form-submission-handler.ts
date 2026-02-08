import { createClient } from "@/lib/supabase/client";
import { loadFormConfig } from "./form-loader";
import type { FormSubmissionRule, NewcomerInsert } from "@/types/database.types";

export interface SubmissionResult {
  success: boolean;
  error?: string;
  recordId?: string;
  isNewRecord?: boolean;
}

/**
 * Generic form submission handler that processes form data based on field mappings and business rules
 */
export async function submitFormData(
  formType: "welcome" | "membership" | "newcomer",
  formData: Record<string, unknown>
): Promise<SubmissionResult> {
  try {
    const supabase = createClient();

    // Load form configuration with fields and rules
    const formConfig = await loadFormConfig(formType);
    if (!formConfig) {
      return {
        success: false,
        error: "Form configuration not found",
      };
    }

    const { formFields, formConfig: config } = formConfig;

    // Load submission rules
    const { data: rulesData } = await supabase
      .from("form_submission_rules")
      .select("*")
      .eq("form_config_id", config.id)
      .order("priority", { ascending: true });

    const rules: FormSubmissionRule[] = rulesData || [];

    // Step 1: Apply field transformations and build database record
    const dbRecord: Partial<NewcomerInsert> = {};
    const notesParts: string[] = [];

    // Process each field based on its mapping configuration
    for (const field of formFields) {
      const fieldValue = formData[field.field_key];

      if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
        continue;
      }

      // Handle field transformations
      switch (field.transformation_type) {
        case "direct":
          // Direct mapping to database column
          if (field.db_column) {
            if (field.field_type === "array" || Array.isArray(fieldValue)) {
              dbRecord[field.db_column as keyof NewcomerInsert] = fieldValue as string[];
            } else {
              dbRecord[field.db_column as keyof NewcomerInsert] = String(fieldValue).trim() as never;
            }
          }
          break;

        case "combine":
          // Combine multiple fields
          const combineConfig = (field.transformation_config as { fields?: string[]; separator?: string }) || {};
          const fieldsToCombine = combineConfig.fields || [];
          const separator = combineConfig.separator || " ";

          if (fieldsToCombine.includes(field.field_key)) {
            const combinedValues = fieldsToCombine
              .map((key) => {
                const val = formData[key];
                return val ? String(val).trim() : "";
              })
              .filter((v) => v)
              .join(separator);

            if (field.db_column && combinedValues) {
              dbRecord[field.db_column as keyof NewcomerInsert] = combinedValues as never;
            }
          }
          break;

        case "notes":
          // Add to notes aggregation
          if (field.is_notes_field) {
            const format = field.notes_format || "{value}";
            const formatted = format.replace("{value}", String(fieldValue).trim());
            notesParts.push(formatted);
          }
          break;

        case "array":
          // Handle array fields
          if (field.db_column) {
            const arrayValue = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
            dbRecord[field.db_column as keyof NewcomerInsert] = arrayValue.map((v) => String(v).trim()) as never;
          }
          break;

        default:
          // Default: direct mapping if db_column is set
          if (field.db_column) {
            dbRecord[field.db_column as keyof NewcomerInsert] = String(fieldValue).trim() as never;
          }
      }
    }

    // Add aggregated notes
    if (notesParts.length > 0) {
      const existingNotes = dbRecord.notes ? String(dbRecord.notes) : "";
      const newNotes = notesParts.join(" | ");
      dbRecord.notes = existingNotes
        ? `${existingNotes} | ${newNotes}`
        : newNotes;
    }

    // Step 2: Execute business rules
    let finalStatus = dbRecord.status || "New";
    let lookupField = "email";
    let mergeStrategy = "merge";

    for (const rule of rules) {
      const ruleConfig = rule.rule_config as Record<string, unknown>;

      if (rule.rule_type === "status_progression") {
        const triggerField = ruleConfig.trigger_field as string;
        const triggerValue = ruleConfig.trigger_value as string;
        const conditions = (ruleConfig.conditions as Array<Record<string, unknown>>) || [];
        const defaultStatus = (ruleConfig.default as string) || "New";

        // Check if trigger condition is met
        if (formData[triggerField] === triggerValue) {
          // Find matching condition
          let matched = false;
          for (const condition of conditions) {
            const currentStatus = condition.current_status as string;
            if (finalStatus === currentStatus) {
              finalStatus = condition.new_status as string;
              matched = true;
              break;
            }
          }
          if (!matched) {
            finalStatus = defaultStatus;
          }
        }
      } else if (rule.rule_type === "conditional_save") {
        lookupField = (ruleConfig.lookup_field as string) || "email";
        mergeStrategy = (ruleConfig.merge_strategy as string) || "merge";
      }
    }

    dbRecord.status = finalStatus;

    // Step 3: Lookup existing record
    const lookupValue = formData[lookupField];
    if (!lookupValue) {
      return {
        success: false,
        error: `Lookup field ${lookupField} is required`,
      };
    }

    const { data: existingRecord, error: fetchError } = await supabase
      .from("newcomers")
      .select("*")
      .eq(lookupField, String(lookupValue).trim())
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    // Step 4: Save to database
    if (existingRecord) {
      // Update existing record
      if (mergeStrategy === "merge") {
        // Merge: only update non-null values, keep existing values if new is empty
        const mergedRecord: Partial<NewcomerInsert> = { ...existingRecord };
        Object.entries(dbRecord).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            mergedRecord[key as keyof NewcomerInsert] = value;
          }
        });
        mergedRecord.status = finalStatus; // Always update status

        const { error: updateError } = await supabase
          .from("newcomers")
          .update(mergedRecord)
          .eq("id", existingRecord.id);

        if (updateError) throw updateError;

        return {
          success: true,
          recordId: existingRecord.id,
          isNewRecord: false,
        };
      } else if (mergeStrategy === "replace") {
        // Replace: overwrite all fields
        const { error: updateError } = await supabase
          .from("newcomers")
          .update(dbRecord)
          .eq("id", existingRecord.id);

        if (updateError) throw updateError;

        return {
          success: true,
          recordId: existingRecord.id,
          isNewRecord: false,
        };
      } else {
        // insert_only: ignore existing, create new (not recommended but supported)
        const { data: newRecord, error: insertError } = await supabase
          .from("newcomers")
          .insert(dbRecord as NewcomerInsert)
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          success: true,
          recordId: newRecord.id,
          isNewRecord: true,
        };
      }
    } else {
      // Insert new record
      const { data: newRecord, error: insertError } = await supabase
        .from("newcomers")
        .insert(dbRecord as NewcomerInsert)
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        recordId: newRecord.id,
        isNewRecord: true,
      };
    }
  } catch (error) {
    console.error("Form submission error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

