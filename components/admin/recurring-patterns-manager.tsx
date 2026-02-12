"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, CheckCircle2, AlertCircle, Play, Calendar } from "lucide-react";
import type { ServiceRecurringPattern, ServiceTemplate } from "@/types/database.types";
import { ServiceGenerationDialog } from "@/components/admin/service-generation-dialog";

interface PatternWithTemplate extends ServiceRecurringPattern {
  template?: ServiceTemplate;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const PATTERN_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-Weekly (Every 2 weeks)" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom (Every N weeks)" },
];

export function RecurringPatternsManager() {
  const [patterns, setPatterns] = useState<PatternWithTemplate[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [selectedPatternForGeneration, setSelectedPatternForGeneration] = useState<PatternWithTemplate | null>(null);

  // Form state
  const [templateId, setTemplateId] = useState("");
  const [patternType, setPatternType] = useState<"weekly" | "bi_weekly" | "monthly" | "custom">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [weekOfMonth, setWeekOfMonth] = useState<number>(1);
  const [intervalWeeks, setIntervalWeeks] = useState<number>(2);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchPatterns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/rota/patterns");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load patterns (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      setPatterns(data.patterns || []);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching patterns:", error);
      setMessage({
        type: "error",
        text: `Failed to load patterns: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/rota/templates?is_active=true");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  useEffect(() => {
    fetchPatterns();
    fetchTemplates();
  }, [fetchPatterns, fetchTemplates]);

  const handleOpenDialog = (pattern?: PatternWithTemplate) => {
    if (pattern) {
      setEditingId(pattern.id);
      setTemplateId(pattern.template_id);
      setPatternType(pattern.pattern_type as "weekly" | "bi_weekly" | "monthly" | "custom");
      setDayOfWeek(pattern.day_of_week ?? 0);
      setWeekOfMonth(pattern.week_of_month ?? 1);
      setIntervalWeeks(pattern.interval_weeks ?? 2);
      setStartDate(pattern.start_date);
      setEndDate(pattern.end_date || "");
      setIsActive(pattern.is_active);
    } else {
      setEditingId(null);
      setTemplateId("");
      setPatternType("weekly");
      setDayOfWeek(0);
      setWeekOfMonth(1);
      setIntervalWeeks(2);
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setIsActive(true);
    }
    setIsDialogOpen(true);
    setMessage(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setTemplateId("");
    setPatternType("weekly");
    setDayOfWeek(0);
    setWeekOfMonth(1);
    setIntervalWeeks(2);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setIsActive(true);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/rota/patterns/${editingId}`
        : "/api/admin/rota/patterns";
      const method = editingId ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        template_id: templateId,
        pattern_type: patternType,
        start_date: startDate,
        is_active: isActive,
      };

      if (patternType === "weekly" || patternType === "bi_weekly" || patternType === "monthly") {
        body.day_of_week = dayOfWeek;
      }

      if (patternType === "monthly") {
        body.week_of_month = weekOfMonth;
      }

      if (patternType === "custom") {
        body.day_of_week = dayOfWeek;
        body.interval_weeks = intervalWeeks;
      }

      if (endDate) {
        body.end_date = endDate;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save pattern");
      }

      setMessage({
        type: "success",
        text: editingId ? "Pattern updated successfully!" : "Pattern created successfully!",
      });

      handleCloseDialog();
      fetchPatterns();
    } catch (error) {
      console.error("Error saving pattern:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save pattern",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pattern? This will set it as inactive.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rota/patterns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete pattern");
      }

      setMessage({
        type: "success",
        text: "Pattern deleted successfully!",
      });

      fetchPatterns();
    } catch (error) {
      console.error("Error deleting pattern:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete pattern",
      });
    }
  };

  const handleGenerate = async (patternId: string) => {
    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) {
      setMessage({
        type: "error",
        text: "Pattern not found",
      });
      return;
    }

    setSelectedPatternForGeneration(pattern);
    setGenerationDialogOpen(true);
  };

  const handleConfirmGeneration = async (selectedDates: string[]) => {
    if (!selectedPatternForGeneration) return;

    setIsGenerating(selectedPatternForGeneration.id);
    setMessage(null);

    try {
      // Generate services for selected dates
      const response = await fetch("/api/admin/rota/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedPatternForGeneration.template_id,
          pattern_id: selectedPatternForGeneration.id,
          dates: selectedDates, // Pass specific dates
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate services");
      }

      const data = await response.json();
      setMessage({
        type: "success",
        text: data.message || `Generated ${data.services?.length || 0} service(s)`,
      });

      // Refresh patterns to update last_generated_date
      fetchPatterns();
    } catch (error) {
      console.error("Error generating services:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to generate services",
      });
      throw error; // Re-throw so dialog can handle it
    } finally {
      setIsGenerating(null);
    }
  };

  const getPatternDescription = (pattern: PatternWithTemplate) => {
    const dayName = DAYS_OF_WEEK.find((d) => d.value === pattern.day_of_week)?.label || "Unknown";
    
    switch (pattern.pattern_type) {
      case "weekly":
        return `Every ${dayName}`;
      case "bi_weekly":
        return `Every 2 weeks on ${dayName}`;
      case "monthly":
        const weekLabel = pattern.week_of_month === 1 ? "1st" :
          pattern.week_of_month === 2 ? "2nd" :
          pattern.week_of_month === 3 ? "3rd" :
          pattern.week_of_month === 4 ? "4th" : "5th";
        return `${weekLabel} ${dayName} of each month`;
      case "custom":
        return `Every ${pattern.interval_weeks} weeks on ${dayName}`;
      default:
        return "Unknown pattern";
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "error"
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-green-500/50 bg-green-500/10 text-green-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Recurring Patterns</CardTitle>
              <CardDescription className="text-slate-400">
                Set up automatic service generation schedules
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Pattern
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Pattern" : "Create New Pattern"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingId
                      ? "Update the recurring pattern"
                      : "Define when services should be automatically generated"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateId" className="text-slate-300">
                      Service Template *
                    </Label>
                    <Select value={templateId} onValueChange={setTemplateId} required>
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patternType" className="text-slate-300">
                      Pattern Type *
                    </Label>
                    <Select
                      value={patternType}
                      onValueChange={(value) =>
                        setPatternType(value as "weekly" | "bi_weekly" | "monthly" | "custom")
                      }
                      required
                    >
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PATTERN_TYPES.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>
                            {pt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(patternType === "weekly" ||
                    patternType === "bi_weekly" ||
                    patternType === "monthly" ||
                    patternType === "custom") && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfWeek" className="text-slate-300">
                        Day of Week *
                      </Label>
                      <Select
                        value={dayOfWeek.toString()}
                        onValueChange={(value) => setDayOfWeek(parseInt(value, 10))}
                        required
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {patternType === "monthly" && (
                    <div className="space-y-2">
                      <Label htmlFor="weekOfMonth" className="text-slate-300">
                        Week of Month *
                      </Label>
                      <Select
                        value={weekOfMonth.toString()}
                        onValueChange={(value) => setWeekOfMonth(parseInt(value, 10))}
                        required
                      >
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st</SelectItem>
                          <SelectItem value="2">2nd</SelectItem>
                          <SelectItem value="3">3rd</SelectItem>
                          <SelectItem value="4">4th</SelectItem>
                          <SelectItem value="5">5th</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {patternType === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="intervalWeeks" className="text-slate-300">
                        Interval (weeks) *
                      </Label>
                      <Input
                        id="intervalWeeks"
                        type="number"
                        min="1"
                        value={intervalWeeks}
                        onChange={(e) => setIntervalWeeks(parseInt(e.target.value, 10) || 1)}
                        required
                        className="border-slate-700 bg-slate-800 text-white"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-slate-300">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-slate-300">
                      End Date (optional)
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                    <p className="text-xs text-slate-500">
                      Leave empty for indefinite pattern
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <Label htmlFor="isActive" className="text-slate-300">
                      Active
                    </Label>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      disabled={isSubmitting}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !templateId || !startDate}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingId ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : patterns.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No patterns created yet.</p>
              <p className="mt-2 text-sm">Click &quot;Create Pattern&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <Card
                  key={pattern.id}
                  className="border-slate-800 bg-slate-800/50"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">
                            {pattern.template?.name || "Unknown Template"}
                          </h3>
                          {!pattern.is_active && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              Inactive
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-blue-600 text-blue-400">
                            {getPatternDescription(pattern)}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>
                            Starts: {new Date(pattern.start_date).toLocaleDateString()}
                          </p>
                          {pattern.end_date && (
                            <p>
                              Ends: {new Date(pattern.end_date).toLocaleDateString()}
                            </p>
                          )}
                          {pattern.last_generated_date && (
                            <p>
                              Last generated: {new Date(pattern.last_generated_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerate(pattern.id)}
                          disabled={isGenerating === pattern.id || !pattern.is_active}
                          className="text-green-400 hover:text-green-300"
                        >
                          {isGenerating === pattern.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(pattern)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pattern.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Preview Dialog */}
      {selectedPatternForGeneration && selectedPatternForGeneration.template && (
        <ServiceGenerationDialog
          open={generationDialogOpen}
          onOpenChange={(open) => {
            setGenerationDialogOpen(open);
            if (!open) {
              setSelectedPatternForGeneration(null);
            }
          }}
          template={selectedPatternForGeneration.template}
          pattern={selectedPatternForGeneration}
          onConfirm={handleConfirmGeneration}
        />
      )}
    </div>
  );
}

