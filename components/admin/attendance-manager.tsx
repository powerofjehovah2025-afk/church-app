"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle, Calendar, UserCheck } from "lucide-react";
import type { Attendance, Service } from "@/types/database.types";

interface AttendanceWithDetails extends Attendance {
  service?: Service;
  member?: { id: string; full_name: string | null; email: string | null };
}

export function AttendanceManager() {
  const [attendance, setAttendance] = useState<AttendanceWithDetails[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [status, setStatus] = useState<string>("present");
  const [notes, setNotes] = useState("");

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedServiceId) params.append("service_id", selectedServiceId);

      const response = await fetch(`/api/admin/attendance?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errorData.error || `Failed to load attendance (${response.status})`,
        });
        return;
      }

      const data = await response.json();
      setAttendance(data.attendance || []);
      setMessage(null);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setMessage({
        type: "error",
        text: `Failed to load attendance: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedServiceId]);

  const fetchServices = useCallback(async () => {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(today.getMonth() + 3);
      const response = await fetch(
        `/api/admin/rota/services?startDate=${today.toISOString().split("T")[0]}&endDate=${endDate.toISOString().split("T")[0]}`
      );
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, []);

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
    fetchAttendance();
    fetchServices();
    fetchMembers();
  }, [fetchAttendance, fetchServices, fetchMembers]);

  const handleOpenDialog = () => {
    setSelectedServiceId("");
    setSelectedMemberId("");
    setStatus("present");
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedServiceId("");
    setSelectedMemberId("");
    setStatus("present");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedServiceId,
          member_id: selectedMemberId,
          status,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to record attendance");
      }

      setMessage({
        type: "success",
        text: "Attendance recorded successfully!",
      });

      handleCloseDialog();
      fetchAttendance();
    } catch (error) {
      console.error("Error recording attendance:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to record attendance",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "absent":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "late":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "excused":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Attendance Tracking</CardTitle>
              <CardDescription className="text-slate-400">
                Record and view member attendance at services
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {new Date(service.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">
                Record Attendance
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No attendance records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((record) => (
                <Card key={record.id} className="border-slate-800 bg-slate-800/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">
                            {record.member?.full_name || record.member?.email || "Unknown"}
                          </h3>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>
                            Service: {record.service?.name || "Unknown"} -{" "}
                            {record.service?.date
                              ? new Date(record.service.date).toLocaleDateString()
                              : "N/A"}
                          </p>
                          {record.checked_in_at && (
                            <p>
                              Checked in: {new Date(record.checked_in_at).toLocaleString()}
                            </p>
                          )}
                          {record.notes && <p>Notes: {record.notes}</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Attendance Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription className="text-slate-400">
              Record attendance for a member at a service
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceId" className="text-slate-300">
                Service *
              </Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId} required>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {new Date(service.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberId" className="text-slate-300">
                Member *
              </Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId} required>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
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
              <Label htmlFor="status" className="text-slate-300">
                Status *
              </Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
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
                disabled={isSubmitting || !selectedServiceId || !selectedMemberId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

