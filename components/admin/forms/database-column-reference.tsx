"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NEWCOMERS_TABLE_COLUMNS } from "@/lib/forms/database-columns";

export function DatabaseColumnReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Database Columns Reference</CardTitle>
        <CardDescription>
          Available columns in the newcomers table for field mapping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {NEWCOMERS_TABLE_COLUMNS.map((column) => (
            <div
              key={column.name}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{column.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {column.type}
                  </Badge>
                  {!column.nullable && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{column.description}</p>
                {column.example && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: {column.example}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Map form fields to these columns to control how data is saved.
            Fields without mappings won&apos;t be saved to the database.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

