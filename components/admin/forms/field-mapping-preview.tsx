"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, FileText, Layers } from "lucide-react";
import type { FormField } from "@/types/database.types";

interface FieldMappingPreviewProps {
  fields: FormField[];
}

export function FieldMappingPreview({ fields }: FieldMappingPreviewProps) {
  const mappedFields = fields.filter((f) => f.db_column);
  const notesFields = fields.filter((f) => f.is_notes_field);
  const combineFields = fields.filter((f) => f.transformation_type === "combine");
  const unmappedFields = fields.filter((f) => !f.db_column && !f.is_notes_field);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Mapping Overview</CardTitle>
        <CardDescription>
          Visual representation of how form fields map to database columns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Direct Mappings */}
        {mappedFields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4" />
              Direct Mappings
            </div>
            <div className="space-y-2 pl-6">
              {mappedFields
                .filter((f) => f.transformation_type === "direct" || !f.transformation_type)
                .map((field) => (
                  <div key={field.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{field.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                      {field.db_column}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Field Combinations */}
        {combineFields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4" />
              Field Combinations
            </div>
            <div className="space-y-2 pl-6">
              {combineFields.map((field) => {
                const config = (field.transformation_config as { fields?: string[]; separator?: string }) || {};
                const fieldsToCombine = config.fields || [];
                const separator = config.separator || " ";

                return (
                  <div key={field.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {fieldsToCombine.map((fk, idx) => {
                        const f = fields.find((ff) => ff.field_key === fk);
                        return (
                          <span key={fk}>
                            <span className="font-medium">{f?.label || fk}</span>
                            {idx < fieldsToCombine.length - 1 && (
                              <span className="text-muted-foreground mx-1">+</span>
                            )}
                          </span>
                        );
                      })}
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {field.db_column}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4">
                      Separator: &quot;{separator}&quot;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes Fields */}
        {notesFields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" />
              Notes Aggregation
            </div>
            <div className="space-y-2 pl-6">
              {notesFields.map((field) => (
                <div key={field.id} className="text-sm">
                  <span className="font-medium">{field.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 inline" />
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    notes
                  </span>
                  {field.notes_format && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: {field.notes_format}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmapped Fields */}
        {unmappedFields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <FileText className="h-4 w-4" />
              Unmapped Fields
            </div>
            <div className="space-y-1 pl-6">
              {unmappedFields.map((field) => (
                <div key={field.id} className="text-sm text-muted-foreground">
                  {field.label} (not saved to database)
                </div>
              ))}
            </div>
          </div>
        )}

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No fields configured yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

