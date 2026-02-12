"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import type { FormConfig, FormField, FormStaticContent } from "@/types/database.types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Option = { label: string; value: string };

interface DynamicFormProps {
  formConfig: FormConfig;
  formFields: FormField[];
  staticContent: FormStaticContent[];
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  isLoading?: boolean;
}

function parseOptions(options: unknown): Option[] {
  if (!options || !Array.isArray(options)) return [];
  return (options as Option[]).filter(
    (opt) => typeof opt?.label === "string" && typeof opt?.value === "string",
  );
}

export function DynamicForm({
  formConfig,
  formFields,
  staticContent,
  onSubmit,
  isLoading,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of formFields) {
      if (field.default_value != null) {
        initial[field.field_key] = field.default_value;
      } else if (field.field_type === "checkbox") {
        initial[field.field_key] = [];
      } else {
        initial[field.field_key] = "";
      }
    }
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = useMemo(() => {
    const map = new Map<string, FormField[]>();
    for (const field of formFields) {
      const section = field.section || "General";
      if (!map.has(section)) {
        map.set(section, []);
      }
      map.get(section)!.push(field);
    }
    return Array.from(map.entries());
  }, [formFields]);

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxChange = (key: string, optionValue: string, checked: boolean) => {
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      if (checked) {
        if (current.includes(optionValue)) return prev;
        return { ...prev, [key]: [...current, optionValue] };
      }
      return { ...prev, [key]: current.filter((v) => v !== optionValue) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {formConfig.title}
        </h1>
        {formConfig.description && (
          <p className="text-sm text-muted-foreground">{formConfig.description}</p>
        )}
      </div>

      {staticContent.length > 0 && (
        <div className="space-y-2 text-sm text-muted-foreground">
          {staticContent.map((block) => (
            <p key={block.id}>{block.content}</p>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {sections.map(([sectionName, fields]) => (
          <div key={sectionName} className="space-y-4">
            {sectionName !== "General" && (
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-1">
                {sectionName}
              </h2>
            )}
            <div className="grid gap-4">
              {fields.map((field) => {
                const fieldValue = values[field.field_key];
                const options = parseOptions(field.options);

                const commonLabel = (
                  <Label className="text-sm font-medium text-foreground">
                    {field.label}
                    {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                    {field.description && (
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                        {field.description}
                      </span>
                    )}
                  </Label>
                );

                switch (field.field_type) {
                  case "textarea":
                    return (
                      <div key={field.id} className="space-y-1.5">
                        {commonLabel}
                        <Textarea
                          value={(fieldValue as string) ?? ""}
                          onChange={(e) => handleChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder ?? undefined}
                          required={field.is_required}
                        />
                      </div>
                    );
                  case "select":
                    return (
                      <div key={field.id} className="space-y-1.5">
                        {commonLabel}
                        <Select
                          value={(fieldValue as string) ?? ""}
                          onValueChange={(val) => handleChange(field.field_key, val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder ?? "Select an option"} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  case "radio":
                    return (
                      <div key={field.id} className="space-y-2">
                        {commonLabel}
                        <div className="space-y-1">
                          {options.map((opt) => (
                            <label
                              key={opt.value}
                              className="flex items-center gap-2 text-sm text-foreground"
                            >
                              <input
                                type="radio"
                                name={field.field_key}
                                value={opt.value}
                                checked={fieldValue === opt.value}
                                onChange={(e) =>
                                  e.target.checked &&
                                  handleChange(field.field_key, e.target.value)
                                }
                                className="h-4 w-4 border-border"
                                required={field.is_required}
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  case "checkbox":
                    return (
                      <div key={field.id} className="space-y-2">
                        {commonLabel}
                        <div className="space-y-1">
                          {options.map((opt) => {
                            const checked =
                              Array.isArray(fieldValue) &&
                              (fieldValue as string[]).includes(opt.value);
                            return (
                              <label
                                key={opt.value}
                                className="flex items-center gap-2 text-sm text-foreground"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(val) =>
                                    handleCheckboxChange(
                                      field.field_key,
                                      opt.value,
                                      Boolean(val),
                                    )
                                  }
                                />
                                <span>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  case "date":
                    return (
                      <div key={field.id} className="space-y-1.5">
                        {commonLabel}
                        <Input
                          type="date"
                          value={(fieldValue as string) ?? ""}
                          onChange={(e) => handleChange(field.field_key, e.target.value)}
                          required={field.is_required}
                        />
                      </div>
                    );
                  case "number":
                    return (
                      <div key={field.id} className="space-y-1.5">
                        {commonLabel}
                        <Input
                          type="number"
                          value={(fieldValue as string | number | undefined) ?? ""}
                          onChange={(e) => handleChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder ?? undefined}
                          required={field.is_required}
                        />
                      </div>
                    );
                  case "email":
                  case "tel":
                  case "text":
                  default:
                    return (
                      <div key={field.id} className="space-y-1.5">
                        {commonLabel}
                        <Input
                          type={field.field_type === "tel" ? "tel" : field.field_type === "email" ? "email" : "text"}
                          value={(fieldValue as string) ?? ""}
                          onChange={(e) => handleChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder ?? undefined}
                          required={field.is_required}
                        />
                      </div>
                    );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? "Submitting..." : formConfig.submit_label || "Submit"}
        </Button>
      </div>
    </form>
  );
}

export default DynamicForm;

