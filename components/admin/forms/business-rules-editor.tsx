"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { FormSubmissionRule, FormField } from "@/types/database.types";

interface BusinessRulesEditorProps {
  formFields: FormField[];
  rules: FormSubmissionRule[];
  onRulesChange: (rules: FormSubmissionRule[]) => void;
  onSave: (rule: Partial<FormSubmissionRule>) => Promise<void>;
  onDelete: (ruleId: string) => Promise<void>;
}

export function BusinessRulesEditor({
  formFields,
  rules,
  onRulesChange,
  onSave,
  onDelete,
}: BusinessRulesEditorProps) {
  const [editingRule, setEditingRule] = useState<Partial<FormSubmissionRule> | null>(null);
  const [ruleType, setRuleType] = useState<"status_progression" | "validation" | "conditional_save">("status_progression");

  const handleAddRule = (type: "status_progression" | "validation" | "conditional_save") => {
    setRuleType(type);
    setEditingRule({
      rule_type: type,
      rule_config: getDefaultRuleConfig(type),
      priority: rules.length,
    });
  };

  const getDefaultRuleConfig = (type: string): Record<string, unknown> => {
    switch (type) {
      case "status_progression":
        return {
          trigger_field: "",
          trigger_value: "",
          conditions: [],
          default: "New",
        };
      case "validation":
        return {
          fields: [],
          condition: "",
          message: "",
        };
      case "conditional_save":
        return {
          lookup_field: "email",
          merge_strategy: "merge",
        };
      default:
        return {};
    }
  };

  const handleSaveRule = async () => {
    if (editingRule) {
      await onSave(editingRule);
      setEditingRule(null);
    }
  };

  const handleDragEnd = (result: {
    destination: { index: number } | null;
    source: { index: number };
  }) => {
    if (!result.destination) return;

    const reorderedRules = Array.from(rules);
    const [removed] = reorderedRules.splice(result.source.index, 1);
    reorderedRules.splice(result.destination.index, 0, removed);

    // Update priorities
    const updatedRules = reorderedRules.map((rule, index) => ({
      ...rule,
      priority: index,
    }));

    onRulesChange(updatedRules);
    // Save priority updates
    updatedRules.forEach((rule) => {
      onSave({ ...rule, priority: rule.priority });
    });
  };

  const renderStatusProgressionEditor = () => {
    if (!editingRule) return null;

    const config = (editingRule.rule_config as Record<string, unknown>) || {};
    const triggerField = (config.trigger_field as string) || "";
    const triggerValue = (config.trigger_value as string) || "";
    const conditions = (config.conditions as Array<Record<string, unknown>>) || [];
    const defaultStatus = (config.default as string) || "New";

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Trigger Field</Label>
          <Select
            value={triggerField}
            onValueChange={(value) =>
              setEditingRule({
                ...editingRule,
                rule_config: { ...config, trigger_field: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field that triggers status change" />
            </SelectTrigger>
            <SelectContent>
              {formFields.map((field) => (
                <SelectItem key={field.field_key} value={field.field_key}>
                  {field.label} ({field.field_key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Trigger Value</Label>
          <Input
            value={triggerValue}
            onChange={(e) =>
              setEditingRule({
                ...editingRule,
                rule_config: { ...config, trigger_value: e.target.value },
              })
            }
            placeholder="e.g., Yes, true, etc."
          />
          <p className="text-xs text-muted-foreground">
            Status will change when this field equals this value
          </p>
        </div>

        <div className="space-y-2">
          <Label>Status Conditions</Label>
          {conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Select
                  value={(condition.current_status as string) || ""}
                  onValueChange={(value) => {
                    const newConditions = [...conditions];
                    newConditions[index] = { ...condition, current_status: value };
                    setEditingRule({
                      ...editingRule,
                      rule_config: { ...config, conditions: newConditions },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Current status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Timer">First Timer</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Engaged">Engaged</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-center text-muted-foreground">→</span>
                <Select
                  value={(condition.new_status as string) || ""}
                  onValueChange={(value) => {
                    const newConditions = [...conditions];
                    newConditions[index] = { ...condition, new_status: value };
                    setEditingRule({
                      ...editingRule,
                      rule_config: { ...config, conditions: newConditions },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="New status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Timer">First Timer</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Engaged">Engaged</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const newConditions = conditions.filter((_, i) => i !== index);
                  setEditingRule({
                    ...editingRule,
                    rule_config: { ...config, conditions: newConditions },
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newConditions = [
                ...conditions,
                { current_status: "", new_status: "" },
              ];
              setEditingRule({
                ...editingRule,
                rule_config: { ...config, conditions: newConditions },
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Default Status</Label>
          <Select
            value={defaultStatus}
            onValueChange={(value) =>
              setEditingRule({
                ...editingRule,
                rule_config: { ...config, default: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="First Timer">First Timer</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Engaged">Engaged</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Status to use if no conditions match
          </p>
        </div>
      </div>
    );
  };

  const renderConditionalSaveEditor = () => {
    if (!editingRule) return null;

    const config = (editingRule.rule_config as Record<string, unknown>) || {};
    const lookupField = (config.lookup_field as string) || "email";
    const mergeStrategy = (config.merge_strategy as string) || "merge";

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Lookup Field</Label>
          <Select
            value={lookupField}
            onValueChange={(value) =>
              setEditingRule({
                ...editingRule,
                rule_config: { ...config, lookup_field: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formFields
                .filter((f) => ["email", "phone"].includes(f.field_key))
                .map((field) => (
                  <SelectItem key={field.field_key} value={field.field_key}>
                    {field.label} ({field.field_key})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Field used to find existing records (usually email)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Merge Strategy</Label>
          <Select
            value={mergeStrategy}
            onValueChange={(value) =>
              setEditingRule({
                ...editingRule,
                rule_config: { ...config, merge_strategy: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="merge">Merge (update existing, keep old values if new is empty)</SelectItem>
              <SelectItem value="replace">Replace (update existing, overwrite all)</SelectItem>
              <SelectItem value="insert_only">Insert Only (create new record, ignore existing)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Business Rules</h3>
          <p className="text-sm text-muted-foreground">
            Configure status progression, validation, and save behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddRule("status_progression")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Status Rule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddRule("conditional_save")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </div>

      {editingRule && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRule.rule_type === "status_progression" && "Status Progression Rule"}
              {editingRule.rule_type === "conditional_save" && "Conditional Save Rule"}
              {editingRule.rule_type === "validation" && "Validation Rule"}
            </CardTitle>
            <CardDescription>Configure the rule parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingRule.rule_type === "status_progression" && renderStatusProgressionEditor()}
            {editingRule.rule_type === "conditional_save" && renderConditionalSaveEditor()}

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSaveRule}>Save Rule</Button>
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rules">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {rules
                .sort((a, b) => a.priority - b.priority)
                .map((rule, index) => (
                  <Draggable key={rule.id} draggableId={rule.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={snapshot.isDragging ? "opacity-50" : ""}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {rule.rule_type === "status_progression" && "Status Progression"}
                                  {rule.rule_type === "conditional_save" && "Conditional Save"}
                                  {rule.rule_type === "validation" && "Validation"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Priority: {rule.priority}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {rule.rule_type === "status_progression" &&
                                  `Trigger: ${(rule.rule_config as Record<string, unknown>).trigger_field || "N/A"}`}
                                {rule.rule_type === "conditional_save" &&
                                  `Lookup: ${(rule.rule_config as Record<string, unknown>).lookup_field || "N/A"}`}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRule(rule)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {rules.length === 0 && !editingRule && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No business rules configured yet.</p>
            <p className="text-sm mt-2">Add rules to control form submission behavior.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

