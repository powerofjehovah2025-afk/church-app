"use client";

import type { FormField } from "@/types/database.types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DynamicFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const options = (field.options as Array<{ label: string; value: string }>) || [];

  const renderField = () => {
    switch (field.field_type) {
      case "text":
      case "email":
      case "tel":
        return (
          <Input
            type={field.field_type}
            id={field.field_key}
            name={field.field_key}
            placeholder={field.placeholder || undefined}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={error ? "border-destructive" : ""}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.field_key}
            name={field.field_key}
            placeholder={field.placeholder || undefined}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={error ? "border-destructive" : ""}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            id={field.field_key}
            name={field.field_key}
            placeholder={field.placeholder || undefined}
            value={(value as number) || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            required={field.is_required}
            className={error ? "border-destructive" : ""}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            id={field.field_key}
            name={field.field_key}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={error ? "border-destructive" : ""}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(val) => onChange(val)}
            required={field.is_required}
          >
            <SelectTrigger className={error ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        const checkboxValue = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.field_key}-${option.value}`}
                  checked={checkboxValue.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...checkboxValue, option.value]);
                    } else {
                      onChange(checkboxValue.filter((v) => v !== option.value));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.field_key}-${option.value}`}
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.field_key}-${option.value}`}
                  name={field.field_key}
                  value={option.value}
                  checked={(value as string) === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  required={field.is_required}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <Label
                  htmlFor={`${field.field_key}-${option.value}`}
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            id={field.field_key}
            name={field.field_key}
            placeholder={field.placeholder || undefined}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            className={error ? "border-destructive" : ""}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_key}>
        {field.label}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {renderField()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

