// Database column reference for newcomers table
// This provides a list of available columns that form fields can map to

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
  example?: string;
}

export const NEWCOMERS_TABLE_COLUMNS: DatabaseColumn[] = [
  { name: "full_name", type: "text", nullable: false, description: "Full name of the person" },
  { name: "email", type: "text", nullable: true, description: "Email address", example: "user@example.com" },
  { name: "phone", type: "text", nullable: true, description: "Phone number" },
  { name: "surname", type: "text", nullable: true, description: "Last name/surname" },
  { name: "address", type: "text", nullable: true, description: "Physical address" },
  { name: "postcode", type: "text", nullable: true, description: "Postal/ZIP code" },
  { name: "gender", type: "text", nullable: true, description: "Gender" },
  { name: "marital_status", type: "text", nullable: true, description: "Marital status" },
  { name: "birthday_day", type: "integer", nullable: true, description: "Day of birth (1-31)" },
  { name: "birthday_month", type: "integer", nullable: true, description: "Month of birth (1-12)" },
  { name: "wedding_anniversary_day", type: "integer", nullable: true, description: "Wedding anniversary day" },
  { name: "wedding_anniversary_month", type: "integer", nullable: true, description: "Wedding anniversary month" },
  { name: "country_of_origin", type: "text", nullable: true, description: "Country of origin" },
  { name: "transport_mode", type: "text", nullable: true, description: "Transportation method" },
  { name: "start_date", type: "text", nullable: true, description: "Start date" },
  { name: "is_born_again", type: "text", nullable: true, description: "Born again status" },
  { name: "baptism_status", type: "boolean", nullable: true, description: "Baptism status" },
  { name: "department_interest", type: "text[]", nullable: true, description: "Array of department interests" },
  { name: "career_sector", type: "text", nullable: true, description: "Career sector" },
  { name: "profession", type: "text", nullable: true, description: "Profession" },
  { name: "has_children", type: "boolean", nullable: true, description: "Has children" },
  { name: "gdpr_consent", type: "boolean", nullable: true, description: "GDPR consent" },
  { name: "service_time", type: "text", nullable: true, description: "Preferred service time" },
  { name: "age_group", type: "text", nullable: true, description: "Age group" },
  { name: "interest_areas", type: "text[]", nullable: true, description: "Array of interest areas" },
  { name: "how_did_you_hear", type: "text", nullable: true, description: "How they heard about the church" },
  { name: "prayer_request", type: "text", nullable: true, description: "Prayer request" },
  { name: "status", type: "text", nullable: true, description: "Status (First Timer, New, Contacted, Engaged, Member)" },
  { name: "notes", type: "text", nullable: true, description: "General notes field (for aggregated data)" },
];

export function getColumnByName(name: string): DatabaseColumn | undefined {
  return NEWCOMERS_TABLE_COLUMNS.find((col) => col.name === name);
}

export function getColumnsByType(type: string): DatabaseColumn[] {
  return NEWCOMERS_TABLE_COLUMNS.filter((col) => col.type === type);
}

