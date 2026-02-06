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
import { Plus, Edit, Trash2, Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import type { ServiceAssignment, Service, DutyType, Profile } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

interface AssignmentWithRelations extends ServiceAssignment {
  service?: Service;
  duty_type?: DutyType;
  member?: Profile;
  assigned_by_user?: Profile;
}

export function AssignmentsManager() {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDutyTypeId, setSelectedDutyTypeId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterServiceId, setFilterServiceId] = useState("");
  const [filterDutyTypeId, setFilterDutyTypeId] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "service" | "duty_type">("none");

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/rota/assignments");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load assignments (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setMessage({
        type: "error",
        text: `Failed to load assignments: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(today.getMonth() + 6);

      const startDateStr = today.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const response = await fetch(
        `/api/admin/rota/services?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, []);

  const fetchDutyTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/rota/duty-types");
      if (response.ok) {
        const data = await response.json();
        setDutyTypes(data.dutyTypes || []);
      }
    } catch (error) {
      console.error("Error fetching duty types:", error);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (!error && data) {
        setMembers(data as Profile[]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchServices();
    fetchDutyTypes();
    fetchMembers();
  }, [fetchAssignments, fetchServices, fetchDutyTypes, fetchMembers]);

  const handleOpenDialog = (assignment?: AssignmentWithRelations) => {
    if (assignment) {
      setEditingId(assignment.id);
      setSelectedServiceId(assignment.service_id);
      setSelectedDutyTypeId(assignment.duty_type_id);
      setSelectedMemberId(assignment.member_id);
      setStatus(assignment.status);
      setNotes(assignment.notes || "");
    } else {
      setEditingId(null);
      setSelectedServiceId("");
      setSelectedDutyTypeId("");
      setSelectedMemberId("");
      setStatus("pending");
      setNotes("");
    }
    setIsDialogOpen(true);
    setMessage(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setSelectedServiceId("");
    setSelectedDutyTypeId("");
    setSelectedMemberId("");
    setStatus("pending");
    setNotes("");
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const url = "/api/admin/rota/assignments";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { id: editingId, status, notes }
            : {
                service_id: selectedServiceId,
                duty_type_id: selectedDutyTypeId,
                member_id: selectedMemberId,
                status,
                notes,
              }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save assignment");
      }

      setMessage({
        type: "success",
        text: editingId ? "Assignment updated successfully!" : "Assignment created successfully!",
      });

      handleCloseDialog();
      fetchAssignments();
    } catch (error) {
      console.error("Error saving assignment:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save assignment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rota/assignments?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove assignment");
      }

      setMessage({
        type: "success",
        text: "Assignment removed successfully!",
      });

      fetchAssignments();
    } catch (error) {
      console.error("Error removing assignment:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to remove assignment",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "declined":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        assignment.service?.name?.toLowerCase().includes(query) ||
        assignment.duty_type?.name?.toLowerCase().includes(query) ||
        assignment.member?.full_name?.toLowerCase().includes(query) ||
        assignment.member?.email?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Service filter
    if (filterServiceId && assignment.service_id !== filterServiceId) {
      return false;
    }

    // Duty type filter
    if (filterDutyTypeId && assignment.duty_type_id !== filterDutyTypeId) {
      return false;
    }

    // Member filter
    if (filterMemberId && assignment.member_id !== filterMemberId) {
      return false;
    }

    return true;
  });

  // Group assignments
  const groupedAssignments = useMemo(() => {
    if (groupBy === "none") {
      return { "All Assignments": filteredAssignments };
    }

    const groups: Record<string, AssignmentWithRelations[]> = {};

    filteredAssignments.forEach((assignment) => {
      let key: string;
      if (groupBy === "service") {
        key = assignment.service?.name || "Unknown Service";
      } else {
        key = assignment.duty_type?.name || "Unknown Duty";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(assignment);
    });

    return groups;
  }, [filteredAssignments, groupBy]);

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Service Assignments</CardTitle>
              <CardDescription className="text-slate-400">
                Assign members to duties for specific services
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-700 bg-slate-900 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Assignment" : "Create New Assignment"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingId
                      ? "Update the assignment status and notes"
                      : "Assign a member to a duty for a specific service"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!editingId && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="service" className="text-slate-300">
                          Service *
                        </Label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId} required>
                          <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-800">
                            {services.map((service) => (
                              <SelectItem
                                key={service.id}
                                value={service.id}
                                className="text-white focus:bg-slate-700"
                              >
                                {service.name} - {formatDate(service.date)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dutyType" className="text-slate-300">
                          Duty Type *
                        </Label>
                        <Select
                          value={selectedDutyTypeId}
                          onValueChange={setSelectedDutyTypeId}
                          required
                        >
                          <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                            <SelectValue placeholder="Select a duty type" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-800">
                            {dutyTypes
                              .filter((dt) => dt.is_active)
                              .map((dutyType) => (
                                <SelectItem
                                  key={dutyType.id}
                                  value={dutyType.id}
                                  className="text-white focus:bg-slate-700"
                                >
                                  {dutyType.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="member" className="text-slate-300">
                          Member *
                        </Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId} required>
                          <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-800 max-h-[200px]">
                            {members.map((member) => (
                              <SelectItem
                                key={member.id}
                                value={member.id}
                                className="text-white focus:bg-slate-700"
                              >
                                {member.full_name || member.email || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-slate-300">
                      Status *
                    </Label>
                    <Select value={status} onValueChange={setStatus} required>
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-800">
                        <SelectItem value="pending" className="text-white focus:bg-slate-700">
                          Pending
                        </SelectItem>
                        <SelectItem value="confirmed" className="text-white focus:bg-slate-700">
                          Confirmed
                        </SelectItem>
                        <SelectItem value="declined" className="text-white focus:bg-slate-700">
                          Declined
                        </SelectItem>
                        <SelectItem value="completed" className="text-white focus:bg-slate-700">
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-slate-300">
                      Notes
                    </Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes"
                      className="border-slate-700 bg-slate-800 text-white"
                    />
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
                      disabled={
                        isSubmitting ||
                        (!editingId && (!selectedServiceId || !selectedDutyTypeId || !selectedMemberId))
                      }
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
          <div className="mb-4 space-y-3">
            <Input
              placeholder="Search by service, duty type, or member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-slate-700 bg-slate-800 text-white"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={filterServiceId} onValueChange={setFilterServiceId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="" className="text-white focus:bg-slate-700">
                    All Services
                  </SelectItem>
                  {services.map((service) => (
                    <SelectItem
                      key={service.id}
                      value={service.id}
                      className="text-white focus:bg-slate-700"
                    >
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDutyTypeId} onValueChange={setFilterDutyTypeId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Filter by duty type" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="" className="text-white focus:bg-slate-700">
                    All Duty Types
                  </SelectItem>
                  {dutyTypes
                    .filter((dt) => dt.is_active)
                    .map((dutyType) => (
                      <SelectItem
                        key={dutyType.id}
                        value={dutyType.id}
                        className="text-white focus:bg-slate-700"
                      >
                        {dutyType.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={filterMemberId} onValueChange={setFilterMemberId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800 max-h-[200px]">
                  <SelectItem value="" className="text-white focus:bg-slate-700">
                    All Members
                  </SelectItem>
                  {members.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      className="text-white focus:bg-slate-700"
                    >
                      {member.full_name || member.email || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as typeof groupBy)}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="none" className="text-white focus:bg-slate-700">
                    No Grouping
                  </SelectItem>
                  <SelectItem value="service" className="text-white focus:bg-slate-700">
                    Group by Service
                  </SelectItem>
                  <SelectItem value="duty_type" className="text-white focus:bg-slate-700">
                    Group by Duty Type
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery || filterServiceId || filterDutyTypeId || filterMemberId
                  ? "No assignments match your filters."
                  : "No assignments created yet."}
              </p>
              <p className="mt-2 text-sm">
                {!(searchQuery || filterServiceId || filterDutyTypeId || filterMemberId) &&
                  'Click "Create Assignment" to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAssignments).map(([groupName, groupAssignments]) => (
                <div key={groupName}>
                  {groupBy !== "none" && (
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      {groupName} ({groupAssignments.length})
                    </h3>
                  )}
                  <div className="space-y-2">
                    {groupAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-medium text-white">
                                {assignment.service?.name || "Unknown Service"}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {assignment.service?.date && formatDate(assignment.service.date)}
                                {assignment.service?.time && ` • ${assignment.service.time}`}
                              </p>
                            </div>
                            <span className="text-slate-500">•</span>
                            <div>
                              <p className="font-medium text-white">
                                {assignment.duty_type?.name || "Unknown Duty"}
                              </p>
                              <p className="text-sm text-slate-400">
                                {assignment.member?.full_name ||
                                  assignment.member?.email ||
                                  "Unknown Member"}
                              </p>
                            </div>
                          </div>
                          {assignment.notes && (
                            <p className="mt-2 text-sm text-slate-400">{assignment.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded border px-2 py-1 text-xs font-medium ${getStatusColor(
                              assignment.status
                            )}`}
                          >
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(assignment)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

