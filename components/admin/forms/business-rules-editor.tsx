"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3 } from "lucide-react";
import type { FormField, FormSubmissionRule } from "@/types/database.types";

interface BusinessRulesEditorProps {
  formFields: FormField[];
  rules: FormSubmissionRule[];
  onRulesChange: (rules: FormSubmissionRule[]) => void;
  onSave: (rule: Partial<FormSubmissionRule>) => Promise<void> | void;
  onDelete: (ruleId: string) => Promise<void> | void;
}

/**
 * Lightweight editor for form submission rules.
 *
 * The exact semantics of `rule_config` are left to the backend. Here we:
 * - List existing rules (type + priority)
 * - Allow creating/updating a rule with a JSON config blob
 */
export function BusinessRulesEditor({
  formFields,
  rules,
  onSave,
  onDelete,
}: BusinessRulesEditorProps) {
  const [editingRule, setEditingRule] = useState<FormSubmissionRule | null>(null);
  const [ruleType, setRuleType] = useState("");
  const [priority, setPriority] = useState<number>(1);
  const [configJson, setConfigJson] = useState("{\n  \n}");
  const [error, setError] = useState<string | null>(null);

  const resetEditor = () => {
    setEditingRule(null);
    setRuleType("");
    setPriority(1);
    setConfigJson("{\n  \n}");
    setError(null);
  };

  const handleEdit = (rule: FormSubmissionRule) => {
    setEditingRule(rule);
    setRuleType(rule.rule_type);
    setPriority(rule.priority ?? 1);
    try {
      setConfigJson(JSON.stringify(rule.rule_config ?? {}, null, 2));
    } catch {
      setConfigJson("{\n  \n}");
    }
    setError(null);
  };

  const handleSaveClick = async () => {
    setError(null);
    let parsedConfig: unknown = {};
    try {
      parsedConfig = configJson.trim() ? JSON.parse(configJson) : {};
    } catch (e) {
      setError(
        e instanceof Error
          ? `Invalid JSON: ${e.message}`
          : "Invalid JSON in rule configuration",
      );
      return;
    }

    if (!ruleType.trim()) {
      setError("Rule type is required");
      return;
    }

    const payload: Partial<FormSubmissionRule> = {
      id: editingRule?.id,
      rule_type: ruleType.trim(),
      priority,
      rule_config: parsedConfig as Record<string, unknown>,
    };

    await onSave(payload);
    resetEditor();
  };

  const handleDeleteClick = async (rule: FormSubmissionRule) => {
    await onDelete(rule.id);
    if (editingRule?.id === rule.id) {
      resetEditor();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.5fr)]">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Business Rules</CardTitle>
          <CardDescription className="text-slate-400">
            Define validation and routing rules that run when a form is submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-slate-400">
              No rules defined yet. Use the editor on the right to create your first rule.
            </p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className="border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 transition-colors"
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-blue-500/40 text-blue-300 text-[10px] px-1.5 py-0.5"
                          >
                            {rule.rule_type}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Priority {rule.priority ?? 1}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 break-all">
                          {(() => {
                            try {
                              return JSON.stringify(rule.rule_config ?? {}, null, 0).slice(
                                0,
                                120,
                              ) + "…";
                            } catch {
                              return "[invalid JSON]";
                            }
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-slate-600"
                          onClick={() => handleEdit(rule)}
                          title="Edit rule"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-red-500/40 text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDeleteClick(rule)}
                          title="Delete rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">
            {editingRule ? "Edit Rule" : "New Rule"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Use JSON config to describe what should happen when the rule matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rule_type">Rule Type</Label>
            <Input
              id="rule_type"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              placeholder="e.g., required_fields, notify_admin, auto_assign"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              min={1}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 1)}
            />
            <p className="text-xs text-slate-500">
              Lower numbers run first (1 runs before 2, etc.).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Rule Config (JSON)</Label>
            <Textarea
              id="config"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-xs text-slate-500">
              This JSON is passed directly to your API. You can reference fields by their{" "}
              <code>field_key</code>. Available fields:{" "}
              {formFields.length > 0
                ? formFields
                    .map((f) => f.field_key)
                    .filter(Boolean)
                    .join(", ")
                : "none yet"}
              .
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 border border-red-500/40 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetEditor}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Rule
            </Button>
            <Button type="button" size="sm" onClick={handleSaveClick}>
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BusinessRulesEditor;

