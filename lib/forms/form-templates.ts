import type { FormFieldInsert, FormSubmissionRuleInsert } from "@/types/database.types";

/**
 * Form templates matching existing form patterns
 * These can be used to quickly set up new forms with pre-configured mappings and rules
 */

export interface FormTemplate {
  name: string;
  description: string;
  fields: Partial<FormFieldInsert>[];
  rules: Partial<FormSubmissionRuleInsert>[];
}

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  welcome: {
    name: "Welcome Form Template",
    description: "Template matching the existing welcome form pattern",
    fields: [
      {
        field_key: "first_name",
        field_type: "text",
        label: "First Name",
        is_required: true,
        db_column: null, // Will be combined
        transformation_type: "combine",
        transformation_config: {
          fields: ["first_name", "surname"],
          separator: " ",
        },
        is_notes_field: false,
      },
      {
        field_key: "surname",
        field_type: "text",
        label: "Surname",
        is_required: true,
        db_column: null, // Will be combined
        transformation_type: "combine",
        transformation_config: {
          fields: ["first_name", "surname"],
          separator: " ",
        },
        is_notes_field: false,
      },
      {
        field_key: "email",
        field_type: "email",
        label: "Email Address",
        is_required: true,
        db_column: "email",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "phone",
        field_type: "tel",
        label: "Phone Number",
        is_required: false,
        db_column: "phone",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "marital_status",
        field_type: "select",
        label: "Marital Status",
        is_required: false,
        db_column: "marital_status",
        transformation_type: "direct",
        is_notes_field: false,
        options: [
          { label: "Single", value: "single" },
          { label: "Married", value: "married" },
          { label: "Divorced", value: "divorced" },
          { label: "Widowed", value: "widowed" },
        ],
      },
      {
        field_key: "address",
        field_type: "textarea",
        label: "Address",
        is_required: false,
        db_column: "address",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "joining_us",
        field_type: "select",
        label: "Are you joining us?",
        is_required: false,
        db_column: null,
        transformation_type: "notes",
        is_notes_field: true,
        notes_format: "Joining us: {value}",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ],
      },
      {
        field_key: "can_visit",
        field_type: "select",
        label: "Can we visit you?",
        is_required: false,
        db_column: null,
        transformation_type: "notes",
        is_notes_field: true,
        notes_format: "Can visit: {value}",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ],
      },
      {
        field_key: "whatsapp_group",
        field_type: "select",
        label: "Join WhatsApp Group?",
        is_required: false,
        db_column: null,
        transformation_type: "notes",
        is_notes_field: true,
        notes_format: "WhatsApp Group: {value}",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ],
      },
    ],
    rules: [
      {
        rule_type: "status_progression",
        rule_config: {
          trigger_field: "joining_us",
          trigger_value: "Yes",
          conditions: [
            { current_status: "First Timer", new_status: "Contacted" },
            { current_status: "New", new_status: "Contacted" },
            { current_status: "Contacted", new_status: "Engaged" },
          ],
          default: "First Timer",
        },
        priority: 0,
      },
      {
        rule_type: "conditional_save",
        rule_config: {
          lookup_field: "email",
          merge_strategy: "merge",
        },
        priority: 1,
      },
    ],
  },
  membership: {
    name: "Membership Form Template",
    description: "Template matching the existing membership form pattern",
    fields: [
      {
        field_key: "first_name",
        field_type: "text",
        label: "First Name",
        is_required: true,
        db_column: null,
        transformation_type: "combine",
        transformation_config: {
          fields: ["first_name", "surname"],
          separator: " ",
        },
        is_notes_field: false,
      },
      {
        field_key: "surname",
        field_type: "text",
        label: "Surname",
        is_required: true,
        db_column: null,
        transformation_type: "combine",
        transformation_config: {
          fields: ["first_name", "surname"],
          separator: " ",
        },
        is_notes_field: false,
      },
      {
        field_key: "email",
        field_type: "email",
        label: "Email Address",
        is_required: true,
        db_column: "email",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "phone",
        field_type: "tel",
        label: "Phone Number",
        is_required: false,
        db_column: "phone",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "gender",
        field_type: "select",
        label: "Gender",
        is_required: false,
        db_column: "gender",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "departments",
        field_type: "select",
        label: "Department Interests",
        is_required: false,
        db_column: "department_interest",
        transformation_type: "array",
        is_notes_field: false,
      },
    ],
    rules: [
      {
        rule_type: "status_progression",
        rule_config: {
          trigger_field: "join_workforce",
          trigger_value: "true",
          conditions: [
            { current_status: "First Timer", new_status: "Contacted" },
            { current_status: "New", new_status: "Contacted" },
            { current_status: "Contacted", new_status: "Engaged" },
            { current_status: "Engaged", new_status: "Member" },
          ],
          default: "New",
        },
        priority: 0,
      },
      {
        rule_type: "conditional_save",
        rule_config: {
          lookup_field: "email",
          merge_strategy: "merge",
        },
        priority: 1,
      },
    ],
  },
  newcomer: {
    name: "Newcomer Form Template",
    description: "Template matching the existing newcomer form pattern",
    fields: [
      {
        field_key: "full_name",
        field_type: "text",
        label: "Full Name",
        is_required: true,
        db_column: "full_name",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "email",
        field_type: "email",
        label: "Email Address",
        is_required: true,
        db_column: "email",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "phone",
        field_type: "tel",
        label: "Phone Number",
        is_required: false,
        db_column: "phone",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "service_time",
        field_type: "select",
        label: "Service Time",
        is_required: false,
        db_column: "service_time",
        transformation_type: "direct",
        is_notes_field: false,
      },
      {
        field_key: "interest_areas",
        field_type: "select",
        label: "Interest Areas",
        is_required: false,
        db_column: "interest_areas",
        transformation_type: "array",
        is_notes_field: false,
      },
    ],
    rules: [
      {
        rule_type: "conditional_save",
        rule_config: {
          lookup_field: "email",
          merge_strategy: "insert_only",
        },
        priority: 0,
      },
    ],
  },
};

export function getTemplate(name: string): FormTemplate | undefined {
  return FORM_TEMPLATES[name];
}

export function getAllTemplates(): FormTemplate[] {
  return Object.values(FORM_TEMPLATES);
}

