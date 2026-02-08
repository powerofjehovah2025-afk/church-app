"use client";

import type { FormField } from "@/types/database.types";
import { DynamicField } from "./dynamic-field";

interface FormSectionProps {
  sectionName: string;
  fields: FormField[];
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (fieldKey: string, value: unknown) => void;
}

export function FormSection({
  sectionName,
  fields,
  formData,
  errors,
  onChange,
}: FormSectionProps) {
  return (
    <div className="space-y-6">
      {sectionName !== "General" && (
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
          {sectionName}
        </h3>
      )}
      <div className="space-y-4">
        {fields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData[field.field_key]}
            onChange={(value) => onChange(field.field_key, value)}
            error={errors[field.field_key]}
          />
        ))}
      </div>
    </div>
  );
}

