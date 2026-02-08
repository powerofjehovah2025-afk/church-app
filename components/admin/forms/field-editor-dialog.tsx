"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Sparkles, AlertCircle, Database } from "lucide-react";
import type { FormField } from "@/types/database.types";
import { NEWCOMERS_TABLE_COLUMNS } from "@/lib/forms/database-columns";

// Field templates for quick setup
const FIELD_TEMPLATES: Record<string, Partial<FormField>> = {
  email: {
    field_type: "email",
    label: "Email Address",
    placeholder: "Enter your email address",
    is_required: true,
    validation_rules: { minLength: 5, maxLength: 255 },
  },
  phone: {
    field_type: "tel",
    label: "Phone Number",
    placeholder: "Enter your phone number",
    is_required: false,
  },
  first_name: {
    field_type: "text",
    label: "First Name",
    placeholder: "Enter your first name",
    is_required: true,
    validation_rules: { minLength: 2, maxLength: 50 },
  },
  last_name: {
    field_type: "text",
    label: "Last Name",
    placeholder: "Enter your last name",
    is_required: true,
    validation_rules: { minLength: 2, maxLength: 50 },
  },
  address: {
    field_type: "textarea",
    label: "Address",
    placeholder: "Enter your full address",
    is_required: false,
  },
  date_of_birth: {
    field_type: "date",
    label: "Date of Birth",
    is_required: false,
  },
  gender: {
    field_type: "select",
    label: "Gender",
    is_required: false,
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
      { label: "Other", value: "other" },
    ],
  },
  marital_status: {
    field_type: "select",
    label: "Marital Status",
    is_required: false,
    options: [
      { label: "Single", value: "single" },
      { label: "Married", value: "married" },
      { label: "Divorced", value: "divorced" },
      { label: "Widowed", value: "widowed" },
    ],
  },
};

// Helper function to convert label to field key
function labelToFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface FieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null;
  onSave: (fieldData: Partial<FormField>) => void;
}

export function FieldEditorDialog({
  open,
  onOpenChange,
  field,
  onSave,
}: FieldEditorDialogProps) {
  const [formData, setFormData] = useState({
    field_key: "",
    field_type: "text",
    label: "",
    placeholder: "",
    description: "",
    is_required: false,
    default_value: "",
    display_order: 0,
    section: "",
    options: [] as Array<{ label: string; value: string }>,
    db_column: "",
    transformation_type: "direct" as "direct" | "combine" | "notes" | "array" | "custom" | null,
    transformation_config: {} as Record<string, unknown>,
    is_notes_field: false,
    notes_format: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bulkOptionsText, setBulkOptionsText] = useState("");

  useEffect(() => {
    if (field) {
      setFormData({
        field_key: field.field_key,
        field_type: field.field_type,
        label: field.label,
        placeholder: field.placeholder || "",
        description: field.description || "",
        is_required: field.is_required,
        default_value: field.default_value || "",
        display_order: field.display_order,
        section: field.section || "",
        options: (field.options as Array<{ label: string; value: string }>) || [],
        db_column: field.db_column || "",
        transformation_type: (field.transformation_type as "direct" | "combine" | "notes" | "array" | "custom") || "direct",
        transformation_config: (field.transformation_config as Record<string, unknown>) || {},
        is_notes_field: field.is_notes_field || false,
        notes_format: field.notes_format || "",
      });
      setBulkOptionsText("");
      setErrors({});
    } else {
      setFormData({
        field_key: "",
        field_type: "text",
        label: "",
        placeholder: "",
        description: "",
        is_required: false,
        default_value: "",
        display_order: 0,
        section: "",
        options: [],
        db_column: "",
        transformation_type: "direct",
        transformation_config: {},
        is_notes_field: false,
        notes_format: "",
      });
      setBulkOptionsText("");
      setErrors({});
    }
  }, [field, open]);

  // Auto-generate field key from label when label changes (only for new fields)
  useEffect(() => {
    if (!field && formData.label && !formData.field_key) {
      const generatedKey = labelToFieldKey(formData.label);
      setFormData((prev) => ({ ...prev, field_key: generatedKey }));
    }
  }, [formData.label, formData.field_key, field]);

  const handleApplyTemplate = (templateKey: string) => {
    const template = FIELD_TEMPLATES[templateKey];
    if (template) {
      setFormData((prev) => ({
        ...prev,
        ...template,
        field_key: labelToFieldKey(template.label || ""),
        label: template.label || prev.label,
        placeholder: template.placeholder || prev.placeholder,
        options: (template.options as Array<{ label: string; value: string }>) || prev.options,
      }));
    }
  };

  const handleBulkImportOptions = () => {
    if (!bulkOptionsText.trim()) return;

    const lines = bulkOptionsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newOptions = lines.map((line) => {
      // Support "Label:Value" or just "Label" format
      if (line.includes(":")) {
        const [label, value] = line.split(":").map((s) => s.trim());
        return { label, value: value || labelToFieldKey(label) };
      }
      return { label: line, value: labelToFieldKey(line) };
    });

    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ...newOptions],
    }));
    setBulkOptionsText("");
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (!formData.field_key.trim()) {
      newErrors.field_key = "Field key is required";
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.field_key)) {
      newErrors.field_key = "Field key must start with a letter and contain only lowercase letters, numbers, and underscores";
    }

    if (needsOptions && formData.options.length === 0) {
      newErrors.options = "At least one option is required for this field type";
    }

    // Validate options
    formData.options.forEach((option, index) => {
      if (!option.label.trim()) {
        newErrors[`option_label_${index}`] = "Option label is required";
      }
      if (!option.value.trim()) {
        newErrors[`option_value_${index}`] = "Option value is required";
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave(formData);
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { label: "", value: "" }],
    });
  };

  const handleUpdateOption = (index: number, key: "label" | "value", value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [key]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const needsOptions = ["select", "checkbox", "radio"].includes(formData.field_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? "Edit Field" : "Add Field"}</DialogTitle>
          <DialogDescription>
            Configure the field properties and validation rules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!field && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Quick Templates</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(FIELD_TEMPLATES).map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(key)}
                    className="text-xs"
                  >
                    {FIELD_TEMPLATES[key].label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click a template to auto-fill common field configurations
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., First Name"
              className={errors.label ? "border-destructive" : ""}
            />
            {errors.label && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.label}
              </p>
            )}
            {!field && formData.label && (
              <p className="text-xs text-muted-foreground">
                Field key will be auto-generated: <code className="bg-muted px-1 rounded">{labelToFieldKey(formData.label)}</code>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_key">Field Key *</Label>
            <div className="flex gap-2">
              <Input
                id="field_key"
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                placeholder="e.g., first_name, email"
                disabled={!!field} // Can't change key for existing fields
                className={errors.field_key ? "border-destructive" : ""}
              />
              {!field && formData.label && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, field_key: labelToFieldKey(formData.label) })}
                  title="Regenerate from label"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            {errors.field_key && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.field_key}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Unique identifier (snake_case). {field ? "Cannot be changed after creation." : "Auto-generated from label."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field_type">Field Type *</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value) => setFormData({ ...formData, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="radio">Radio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: Number(e.target.value) })
                }
              />
            </div>
          </div>


          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="e.g., Enter your first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Help text shown below the field"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g., Personal Info, Church Info"
            />
            <p className="text-xs text-muted-foreground">
              Group fields into sections (leave empty for &quot;General&quot;)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_value">Default Value</Label>
            <Input
              id="default_value"
              value={formData.default_value}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              placeholder="Default value for this field"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_required: checked as boolean })
              }
            />
            <Label htmlFor="is_required" className="cursor-pointer">
              Required field
            </Label>
          </div>

          {/* Database Mapping Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Database Mapping</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="db_column">Database Column</Label>
              <Select
                value={formData.db_column || ""}
                onValueChange={(value) => setFormData({ ...formData, db_column: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database column (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (not saved to database)</SelectItem>
                  {NEWCOMERS_TABLE_COLUMNS.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.db_column && (
                <p className="text-xs text-muted-foreground">
                  {NEWCOMERS_TABLE_COLUMNS.find((c) => c.name === formData.db_column)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transformation_type">Transformation Type</Label>
              <Select
                value={formData.transformation_type || "direct"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    transformation_type: value as "direct" | "combine" | "notes" | "array" | "custom",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Mapping (1:1)</SelectItem>
                  <SelectItem value="combine">Combine Fields</SelectItem>
                  <SelectItem value="notes">Store in Notes</SelectItem>
                  <SelectItem value="array">Array Field</SelectItem>
                  <SelectItem value="custom">Custom Logic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.transformation_type === "direct" && "Field value maps directly to database column"}
                {formData.transformation_type === "combine" && "Combine multiple fields into one database column"}
                {formData.transformation_type === "notes" && "Store field value in the notes column"}
                {formData.transformation_type === "array" && "Store as array in database"}
                {formData.transformation_type === "custom" && "Custom transformation logic"}
              </p>
            </div>

            {formData.transformation_type === "notes" && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_notes_field"
                    checked={formData.is_notes_field}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_notes_field: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_notes_field" className="cursor-pointer">
                    Aggregate into notes field
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes_format">Notes Format</Label>
                  <Input
                    id="notes_format"
                    value={formData.notes_format}
                    onChange={(e) => setFormData({ ...formData, notes_format: e.target.value })}
                    placeholder="e.g., Joining us: {value}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{value}"} as placeholder for the field value. Example: &quot;Field Name: {"{value}"}&quot;
                  </p>
                </div>
              </div>
            )}

            {formData.transformation_type === "combine" && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                <Label className="text-sm">Field Combination</Label>
                <p className="text-xs text-muted-foreground">
                  Field combination configuration will be added in a separate component.
                </p>
              </div>
            )}
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Options {formData.options.length > 0 && `(${formData.options.length})`}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                  Add Option
                </Button>
              </div>
              {errors.options && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.options}
                </p>
              )}
              
              {/* Bulk Import */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                <Label className="text-sm">Bulk Import Options</Label>
                <Textarea
                  value={bulkOptionsText}
                  onChange={(e) => setBulkOptionsText(e.target.value)}
                  placeholder="Enter one option per line. Use 'Label:Value' format or just 'Label' (value will be auto-generated)"
                  rows={3}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBulkImportOptions}
                  disabled={!bulkOptionsText.trim()}
                >
                  Import Options
                </Button>
                <p className="text-xs text-muted-foreground">
                  Example: Male:male{'\n'}Female:female{'\n'}Other
                </p>
              </div>

              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) =>
                          handleUpdateOption(index, "label", e.target.value)
                        }
                        className={errors[`option_label_${index}`] ? "border-destructive" : ""}
                      />
                      {errors[`option_label_${index}`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`option_label_${index}`]}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value"
                        value={option.value}
                        onChange={(e) =>
                          handleUpdateOption(index, "value", e.target.value)
                        }
                        className={errors[`option_value_${index}`] ? "border-destructive" : ""}
                      />
                      {errors[`option_value_${index}`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`option_value_${index}`]}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {formData.options.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options yet. Add individually or use bulk import above.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Field</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

