"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Copy, Printer, Download } from "lucide-react";
import type { ServiceTemplate, DutyType, Service } from "@/types/database.types";

interface Assignment {
  id: string;
  service_id: string;
  duty_type_id: string;
  member_id: string;
  status: string;
  notes: string | null;
  service: Service;
  duty_type: DutyType;
  member: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface Member {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function RotaGrid() {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("__all__");
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    serviceId: string;
    dutyTypeId: string;
    assignmentId?: string;
  } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const today = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 56);
  const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split("T")[0]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/rota/templates?is_active=true");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        const savedTemplateId = localStorage.getItem("rota_selected_template");
        if (savedTemplateId && data.templates?.some((t: ServiceTemplate) => t.id === savedTemplateId)) {
          setSelectedTemplateId(savedTemplateId);
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  const fetchDutyTypes = useCallback(async (templateId: string) => {
    if (!templateId || templateId === "__all__") {
      setDutyTypes([]);
      return;
    }
    try {
      const response = await fetch(`/api/admin/rota/templates/${templateId}/duty-types`);
      if (response.ok) {
        const data = await response.json();
        const dt = (data.dutyTypes || []).map((dt: { duty_type: DutyType }) => dt.duty_type);
        setDutyTypes(dt);
      }
    } catch (error) {
      console.error("Error fetching duty types:", error);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/rota/services?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        const svcs = (data.services || []).filter((s: Service) =>
          selectedTemplateId && selectedTemplateId !== "__all__"
            ? templates.find((t) => t.id === selectedTemplateId)?.name === s.name
            : true
        );
        setServices(svcs);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedTemplateId, templates]);

  const fetchAssignments = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      if (selectedTemplateId && selectedTemplateId !== "__all__") {
        params.append("template_id", selectedTemplateId);
      }
      const response = await fetch(`/api/admin/rota/assignments?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, [startDate, endDate, selectedTemplateId]);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchMembers();
  }, [fetchTemplates, fetchMembers]);

  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== "__all__") {
      localStorage.setItem("rota_selected_template", selectedTemplateId);
      fetchDutyTypes(selectedTemplateId);
    } else {
      setDutyTypes([]);
    }
  }, [selectedTemplateId, fetchDutyTypes]);

  useEffect(() => {
    const savedStart = localStorage.getItem("rota_start_date");
    const savedEnd = localStorage.getItem("rota_end_date");
    if (savedStart) setStartDate(savedStart);
    if (savedEnd) setEndDate(savedEnd);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      localStorage.setItem("rota_start_date", startDate);
      localStorage.setItem("rota_end_date", endDate);
      fetchServices();
      fetchAssignments();
    }
  }, [startDate, endDate, fetchServices, fetchAssignments]);

  const getAssignment = (serviceId: string, dutyTypeId: string): Assignment | undefined => {
    return assignments.find(
      (a) => a.service_id === serviceId && a.duty_type_id === dutyTypeId
    );
  };

  const handleCellClick = (serviceId: string, dutyTypeId: string) => {
    const assignment = getAssignment(serviceId, dutyTypeId);
    setSelectedCell({
      serviceId,
      dutyTypeId,
      assignmentId: assignment?.id,
    });
    setSelectedMemberId(assignment?.member_id || "");
    setNotes(assignment?.notes || "");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCell(null);
    setSelectedMemberId("");
    setNotes("");
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedCell) return;
    if (!selectedMemberId) {
      setMessage({ type: "error", text: "Please select a member" });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      if (selectedCell.assignmentId) {
        const response = await fetch(`/api/admin/rota/assignments/${selectedCell.assignmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: selectedMemberId,
            notes: notes || null,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update assignment");
        }
      } else {
        const response = await fetch("/api/admin/rota/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: selectedCell.serviceId,
            duty_type_id: selectedCell.dutyTypeId,
            member_id: selectedMemberId,
            notes: notes || null,
            template_id: selectedTemplateId && selectedTemplateId !== "__all__" ? selectedTemplateId : undefined,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create assignment");
        }
      }
      setMessage({ type: "success", text: "Assignment saved" });
      await fetchAssignments();
      setTimeout(() => {
        handleCloseDialog();
      }, 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save assignment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedCell?.assignmentId) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/rota/assignments/${selectedCell.assignmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unassign");
      }
      setMessage({ type: "success", text: "Assignment removed" });
      await fetchAssignments();
      setTimeout(() => {
        handleCloseDialog();
      }, 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to unassign",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateDateRange = (weeks: number) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    start.setDate(start.getDate() + weeks * 7);
    end.setTime(start.getTime() + diff);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const handleCopyFromPrevious = async () => {
    if (!selectedCell || !selectedService) return;
    const serviceDate = new Date(selectedService.date);
    const previousDate = new Date(serviceDate);
    previousDate.setDate(previousDate.getDate() - 7);
    const prevDateStr = previousDate.toISOString().split("T")[0];
    try {
      const svcResponse = await fetch(
        `/api/admin/rota/services?startDate=${prevDateStr}&endDate=${prevDateStr}`
      );
      if (!svcResponse.ok) return;
      const svcData = await svcResponse.json();
      const prevService = (svcData.services || []).find(
        (s: Service) => s.name === selectedService.name && s.date === prevDateStr
      );
      if (!prevService) {
        setMessage({ type: "error", text: "No previous service found" });
        return;
      }
      const assignResponse = await fetch(
        `/api/admin/rota/assignments?service_id=${prevService.id}`
      );
      if (!assignResponse.ok) return;
      const assignData = await assignResponse.json();
      const prevAssignment = (assignData.assignments || []).find(
        (a: Assignment) => a.duty_type_id === selectedCell.dutyTypeId
      );
      if (prevAssignment) {
        setSelectedMemberId(prevAssignment.member_id);
        setNotes(prevAssignment.notes || "");
        setMessage({ type: "success", text: "Copied from previous week" });
      } else {
        setMessage({ type: "error", text: "No assignment found for previous week" });
      }
    } catch (error) {
      console.error("Error copying from previous:", error);
      setMessage({
        type: "error",
        text: "Failed to copy from previous week",
      });
    }
  };

  const selectedService = selectedCell
    ? services.find((s) => s.id === selectedCell.serviceId)
    : null;
  const selectedDutyType = selectedCell
    ? dutyTypes.find((dt) => dt.id === selectedCell.dutyTypeId)
    : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (services.length === 0 || dutyTypes.length === 0) return;
    const escapeCSV = (str: string) => {
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows: string[] = [];
    rows.push("Date,Service Name,Time,Duty Type,Member,Notes");
    services.forEach((service) => {
      dutyTypes.forEach((dutyType) => {
        const assignment = getAssignment(service.id, dutyType.id);
        const date = new Date(service.date).toLocaleDateString("en-GB");
        const memberName = assignment
          ? assignment.member.full_name || assignment.member.email || "Unknown"
          : "Unassigned";
        const notes = assignment?.notes || "";
        rows.push(
          [
            escapeCSV(date),
            escapeCSV(service.name),
            escapeCSV(service.time || ""),
            escapeCSV(dutyType.name),
            escapeCSV(memberName),
            escapeCSV(notes),
          ].join(",")
        );
      });
    });
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rota-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-6">
      <Card className="min-w-0 border-slate-800 bg-slate-900/50 print:hidden">
        <CardHeader className="min-w-0">
          <CardTitle className="text-white">Service Rota</CardTitle>
          <CardDescription className="text-slate-400 text-pretty">
            Assign members to duties for each service. Tap a cell to assign or update.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 sm:min-w-[200px] space-y-2">
              <Label htmlFor="template" className="text-slate-300">
                Template
              </Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger
                  id="template"
                  className="bg-slate-800/50 border-slate-700/50 text-white min-h-[44px] w-full sm:w-auto"
                >
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Templates</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0 sm:min-w-[150px] space-y-2">
              <Label htmlFor="startDate" className="text-slate-300">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white min-h-[44px]"
              />
            </div>
            <div className="flex-1 min-w-0 sm:min-w-[150px] space-y-2">
              <Label htmlFor="endDate" className="text-slate-300">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white min-h-[44px]"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDateRange(-4)}
                className="border-slate-700 text-slate-300 min-h-[44px] min-w-[44px]"
                title="Previous 4 weeks"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDateRange(4)}
                className="border-slate-700 text-slate-300 min-h-[44px] min-w-[44px]"
                title="Next 4 weeks"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex min-w-0 flex-wrap gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="shrink-0 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Printer className="mr-2 h-4 w-4 shrink-0" />
              Print Rota
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={services.length === 0 || dutyTypes.length === 0}
              className="shrink-0 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Download className="mr-2 h-4 w-4 shrink-0" />
              Export CSV
            </Button>
          </div>
          {startDate && endDate && (
            <p className="text-xs text-slate-500">
              Showing: {new Date(startDate).toLocaleDateString()} –{" "}
              {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {message && (
        <Card
          className={
            message.type === "success"
              ? "bg-green-500/20 border-green-500/50"
              : "bg-red-500/20 border-red-500/50"
          }
        >
          <CardContent className="pt-6">
            <p
              className={
                message.type === "success" ? "text-green-300" : "text-red-300"
              }
            >
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      {!selectedTemplateId || selectedTemplateId === "__all__" ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6 text-center text-slate-400">
            <p>Please select a template to view the rota grid.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </CardContent>
        </Card>
      ) : services.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6 text-center text-slate-400">
            <p>No services found in this date range.</p>
            <p className="text-xs mt-2">
              Generate services from the Recurring tab.
            </p>
          </CardContent>
        </Card>
      ) : dutyTypes.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6 text-center text-slate-400">
            <p>This template has no duty types configured.</p>
            <p className="text-xs mt-2">
              Add duty types from the Templates tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-w-0 border-slate-800 bg-slate-900/50 print:border-0 print:shadow-none">
          <CardContent className="min-w-0 overflow-x-auto pt-4 sm:pt-6 print:p-4">
            <div className="hidden print:block mb-4">
              <h2 className="text-lg font-bold text-white">
                {templates.find((t) => t.id === selectedTemplateId)?.name || "Service Rota"}
              </h2>
              <p className="text-sm text-slate-400">
                {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
              </p>
            </div>
            <Table className="print:text-xs">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300 font-medium sticky left-0 bg-slate-900/95 z-10">
                    Duty Type
                  </TableHead>
                  {services.map((service) => (
                    <TableHead
                      key={service.id}
                      className="text-slate-300 font-medium min-w-[100px] sm:min-w-[120px] text-center text-xs sm:text-sm"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs">
                          {new Date(service.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {service.time && (
                          <span className="text-xs text-slate-500">{service.time}</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dutyTypes.map((dutyType) => (
                  <TableRow key={dutyType.id} className="border-slate-700">
                    <TableCell className="font-medium text-white sticky left-0 bg-slate-800/95 z-10">
                      {dutyType.name}
                    </TableCell>
                    {services.map((service) => {
                      const assignment = getAssignment(service.id, dutyType.id);
                      return (
                        <TableCell
                          key={`${service.id}-${dutyType.id}`}
                          className="text-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                          onClick={() => handleCellClick(service.id, dutyType.id)}
                        >
                          {assignment ? (
                            <div className="py-1">
                              <p className="text-sm text-white">
                                {assignment.member.full_name || assignment.member.email || "Unknown"}
                              </p>
                              {assignment.notes && (
                                <p className="text-xs text-slate-500 mt-1 truncate" title={assignment.notes}>
                                  {assignment.notes}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="py-1 text-slate-500 text-sm">—</div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.assignmentId ? "Update Assignment" : "Assign Member"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedService && selectedDutyType && (
                <>
                  {selectedDutyType.name} for {selectedService.name} on{" "}
                  {new Date(selectedService.date).toLocaleDateString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member" className="text-slate-300">
                Member *
              </Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger
                  id="member"
                  className="border-slate-700 bg-slate-800 text-white"
                >
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.email || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${
                  message.type === "success" ? "text-green-300" : "text-red-300"
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedService && !selectedCell?.assignmentId && (
              <Button
                variant="outline"
                onClick={handleCopyFromPrevious}
                disabled={isSubmitting}
                className="border-slate-700 text-slate-300 w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy from previous week
              </Button>
            )}
            {selectedCell?.assignmentId && (
              <Button
                variant="destructive"
                onClick={handleUnassign}
                disabled={isSubmitting}
                className="mr-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Unassign
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || !selectedMemberId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedCell?.assignmentId ? "Update" : "Assign"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
