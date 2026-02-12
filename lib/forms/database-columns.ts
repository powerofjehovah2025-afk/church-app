import type { Newcomer } from "@/types/database.types";

export interface DatabaseColumnMeta {
  name: keyof Newcomer | string;
  type: string;
  description: string;
}

/**
 * Metadata for mapping dynamic form fields into the `newcomers` table.
 * This is intentionally focused on the most common fields used by the
 * welcome / membership flows.
 */
export const NEWCOMERS_TABLE_COLUMNS: DatabaseColumnMeta[] = [
  {
    name: "full_name",
    type: "text",
    description: "Visitor's full name",
  },
  {
    name: "surname",
    type: "text",
    description: "Last name / surname",
  },
  {
    name: "email",
    type: "text",
    description: "Email address",
  },
  {
    name: "phone",
    type: "text",
    description: "Primary phone / mobile number",
  },
  {
    name: "whatsapp_number",
    type: "text",
    description: "WhatsApp contact number",
  },
  {
    name: "address",
    type: "text",
    description: "Home address",
  },
  {
    name: "postcode",
    type: "text",
    description: "Postcode / ZIP code",
  },
  {
    name: "country_of_origin",
    type: "text",
    description: "Country of origin",
  },
  {
    name: "age_group",
    type: "text",
    description: "Age group (youth, adult, etc.)",
  },
  {
    name: "gender",
    type: "text",
    description: "Gender",
  },
  {
    name: "marital_status",
    type: "text",
    description: "Marital status",
  },
  {
    name: "occupation",
    type: "text",
    description: "Occupation / job title",
  },
  {
    name: "career_sector",
    type: "text",
    description: "Career sector or industry",
  },
  {
    name: "service_time",
    type: "text",
    description: "Service attended (time or description)",
  },
  {
    name: "status",
    type: "text",
    description: "Follow-up status (New, Contacted, Member, etc.)",
  },
  {
    name: "prayer_request",
    type: "text",
    description: "Prayer requests captured from the form",
  },
  {
    name: "department_interest",
    type: "text[]",
    description: "Array of departments or ministries of interest",
  },
  {
    name: "notes",
    type: "text",
    description: "Aggregated notes built from dynamic form fields",
  },
];

