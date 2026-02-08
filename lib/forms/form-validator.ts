import type { FormField } from "@/types/database.types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate form data against form field configurations
 */
export function validateFormData(
  formData: Record<string, unknown>,
  fields: FormField[]
): ValidationResult {
  const errors: ValidationError[] = [];

  fields.forEach((field) => {
    const value = formData[field.field_key];
    const validationRules = field.validation_rules as Record<string, unknown> || {};

    // Check required fields
    if (field.is_required) {
      if (value === undefined || value === null || value === "") {
        errors.push({
          field: field.field_key,
          message: `${field.label} is required`,
        });
        return;
      }
    }

    // Skip validation if field is empty and not required
    if (value === undefined || value === null || value === "") {
      return;
    }

    // Type-specific validation
    if (field.field_type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === "string" && !emailRegex.test(value)) {
        errors.push({
          field: field.field_key,
          message: `${field.label} must be a valid email address`,
        });
      }
    }

    if (field.field_type === "tel") {
      // Basic phone validation - can be enhanced
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (typeof value === "string" && !phoneRegex.test(value)) {
        errors.push({
          field: field.field_key,
          message: `${field.label} must be a valid phone number`,
        });
      }
    }

    if (field.field_type === "number") {
      if (isNaN(Number(value))) {
        errors.push({
          field: field.field_key,
          message: `${field.label} must be a number`,
        });
      }
    }

    // Custom validation rules from JSONB
    if (validationRules.minLength && typeof value === "string") {
      if (value.length < Number(validationRules.minLength)) {
        errors.push({
          field: field.field_key,
          message: `${field.label} must be at least ${validationRules.minLength} characters`,
        });
      }
    }

    if (validationRules.maxLength && typeof value === "string") {
      if (value.length > Number(validationRules.maxLength)) {
        errors.push({
          field: field.field_key,
          message: `${field.label} must be no more than ${validationRules.maxLength} characters`,
        });
      }
    }

    if (validationRules.pattern && typeof value === "string") {
      try {
        const regex = new RegExp(validationRules.pattern as string);
        if (!regex.test(value)) {
          errors.push({
            field: field.field_key,
            message: validationRules.patternMessage as string || `${field.label} format is invalid`,
          });
        }
      } catch {
        // Invalid regex pattern, skip
        console.warn("Invalid regex pattern in validation rules:", validationRules.pattern);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

