"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertTriangle, Calendar, Clock } from "lucide-react";
import { calculateNextServiceDates } from "@/lib/rota/service-generator";
import type { ServiceRecurringPattern, ServiceTemplate } from "@/types/database.types";

interface ServiceGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ServiceTemplate | null;
  pattern: ServiceRecurringPattern | null;
  onConfirm: (selectedDates: string[]) => Promise<void>;
}

interface DatePreview {
  date: string;
  name: string;
  time: string | null;
  exists: boolean;
  selected: boolean;
}

export function ServiceGenerationDialog({
  open,
  onOpenChange,
  template,
  pattern,
  onConfirm,
}: ServiceGenerationDialogProps) {
  const [previewDates, setPreviewDates] = useState<DatePreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && template) {
      loadPreview();
    } else {
      setPreviewDates([]);
      setError(null);
    }
  }, [open, template, pattern]);

  const loadPreview = async () => {
    if (!template) return;

    setIsLoading(true);
    setError(null);

    try {
      let dates: string[] = [];

      if (pattern) {
        // Calculate dates from pattern
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 3); // Preview next 3 months

        dates = calculateNextServiceDates(
          {
            pattern_type: pattern.pattern_type as "weekly" | "bi_weekly" | "monthly" | "custom",
            day_of_week: pattern.day_of_week,
            week_of_month: pattern.week_of_month,
            interval_weeks: pattern.interval_weeks,
            start_date: pattern.start_date,
            end_date: pattern.end_date,
            last_generated_date: pattern.last_generated_date,
          },
          today,
          endDate
        );
      } else {
        // Manual generation - show next 4 weeks as preview
        const today = new Date();
        for (let i = 0; i < 4; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i * 7);
          dates.push(date.toISOString().split("T")[0]);
        }
      }

      // Check for existing services
      const existingResponse = await fetch(
        `/api/admin/rota/services?startDate=${dates[0] || ""}&endDate=${dates[dates.length - 1] || ""}`
      );
      const existingData = existingResponse.ok ? await existingResponse.json() : { services: [] };
      const existingServices = new Map(
        (existingData.services || []).map((s: { date: string; name: string }) => [s.date, s])
      );

      // Create preview
      const preview: DatePreview[] = dates.map((date) => ({
        date,
        name: template.name,
        time: template.default_time,
        exists: existingServices.has(date),
        selected: !existingServices.has(date), // Auto-select non-existing dates
      }));

      setPreviewDates(preview);
    } catch (err) {
      console.error("Error loading preview:", err);
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDate = (date: string) => {
    setPreviewDates((prev) =>
      prev.map((p) => (p.date === date ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = () => {
    const allSelected = previewDates.every((p) => p.selected || p.exists);
    setPreviewDates((prev) =>
      prev.map((p) => (p.exists ? p : { ...p, selected: !allSelected }))
    );
  };

  const handleConfirm = async () => {
    const selectedDates = previewDates.filter((p) => p.selected && !p.exists).map((p) => p.date);

    if (selectedDates.length === 0) {
      setError("Please select at least one date to generate");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await onConfirm(selectedDates);
      onOpenChange(false);
    } catch (err) {
      console.error("Error generating services:", err);
      setError(err instanceof Error ? err.message : "Failed to generate services");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = previewDates.filter((p) => p.selected && !p.exists).length;
  const existingCount = previewDates.filter((p) => p.exists).length;
  const canSelectAll = previewDates.some((p) => !p.selected && !p.exists);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-700 bg-slate-900 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Services - Preview</DialogTitle>
          <DialogDescription className="text-slate-400">
            Review and select which services to generate from template:{" "}
            <span className="text-white font-medium">{template?.name}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : error && !previewDates.length ? (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {selectedCount} selected, {existingCount} already exist
                </div>
                {canSelectAll && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Select All Available
                  </Button>
                )}
              </div>

              {existingCount > 0 && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <p>
                      {existingCount} service(s) already exist for these dates and will be skipped.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previewDates.map((preview) => (
                  <div
                    key={preview.date}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      preview.exists
                        ? "border-slate-700 bg-slate-800/30 opacity-60"
                        : preview.selected
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/50"
                    }`}
                  >
                    <Checkbox
                      checked={preview.selected}
                      onCheckedChange={() => handleToggleDate(preview.date)}
                      disabled={preview.exists}
                      className="border-slate-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-white">
                          {new Date(preview.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        {preview.exists && (
                          <span className="text-xs text-yellow-400">(Already exists)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>{preview.name}</span>
                        {preview.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{preview.time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isGenerating || selectedCount === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  `Generate ${selectedCount} Service${selectedCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

