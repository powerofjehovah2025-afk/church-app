"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import type { FormField } from "@/types/database.types";

interface FieldCombinationBuilderProps {
  availableFields: FormField[];
  combinationConfig: {
    fields: string[];
    separator: string;
    targetColumn: string;
  } | null;
  onConfigChange: (config: { fields: string[]; separator: string; targetColumn: string } | null) => void;
}

export function FieldCombinationBuilder({
  availableFields,
  combinationConfig,
  onConfigChange,
}: FieldCombinationBuilderProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    combinationConfig?.fields || []
  );
  const [separator, setSeparator] = useState<string>(combinationConfig?.separator || " ");
  const [targetColumn, setTargetColumn] = useState<string>(combinationConfig?.targetColumn || "");

  useEffect(() => {
    if (combinationConfig) {
      setSelectedFields(combinationConfig.fields);
      setSeparator(combinationConfig.separator);
      setTargetColumn(combinationConfig.targetColumn);
    }
  }, [combinationConfig]);

  const handleAddField = () => {
    const remainingFields = availableFields.filter(
      (f) => !selectedFields.includes(f.field_key)
    );
    if (remainingFields.length > 0) {
      setSelectedFields([...selectedFields, remainingFields[0].field_key]);
    }
  };

  const handleRemoveField = (fieldKey: string) => {
    setSelectedFields(selectedFields.filter((key) => key !== fieldKey));
  };

  const handleFieldChange = (index: number, fieldKey: string) => {
    const newFields = [...selectedFields];
    newFields[index] = fieldKey;
    setSelectedFields(newFields);
  };

  const handleSave = () => {
    if (selectedFields.length > 0 && targetColumn) {
      onConfigChange({
        fields: selectedFields,
        separator,
        targetColumn,
      });
    }
  };

  const handleClear = () => {
    setSelectedFields([]);
    setSeparator(" ");
    setTargetColumn("");
    onConfigChange(null);
  };

  // Preview the combination
  const previewFields = selectedFields.map((key) => {
    const field = availableFields.find((f) => f.field_key === key);
    return field ? field.label : key;
  });
  const previewText = previewFields.join(separator || " ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Combination</CardTitle>
        <CardDescription>
          Combine multiple fields into a single database column (e.g., first_name + surname → full_name)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Target Database Column</Label>
          <Input
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            placeholder="e.g., full_name"
          />
          <p className="text-xs text-muted-foreground">
            The database column where the combined value will be saved
          </p>
        </div>

        <div className="space-y-2">
          <Label>Fields to Combine</Label>
          {selectedFields.map((fieldKey, index) => {
            const availableOptions = availableFields.filter(
              (f) => !selectedFields.includes(f.field_key) || f.field_key === fieldKey
            );

            return (
              <div key={index} className="flex gap-2 items-center">
                <Select
                  value={fieldKey}
                  onValueChange={(value) => handleFieldChange(index, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.map((f) => (
                      <SelectItem key={f.field_key} value={f.field_key}>
                        {f.label} ({f.field_key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveField(fieldKey)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {selectedFields.length < availableFields.length && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>Separator</Label>
          <Select value={separator} onValueChange={setSeparator}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Space</SelectItem>
              <SelectItem value=", ">Comma</SelectItem>
              <SelectItem value=" - ">Dash</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {separator === "custom" && (
            <Input
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              placeholder="Enter custom separator"
            />
          )}
        </div>

        {selectedFields.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg border">
            <Label className="text-sm font-medium">Preview</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {previewText || "Select fields to see preview"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Example: &quot;{previewFields[0] || "First"} {separator || " "}
              {previewFields[1] || "Last"}&quot; → {targetColumn || "target_column"}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={selectedFields.length === 0 || !targetColumn}>
            Save Combination
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

