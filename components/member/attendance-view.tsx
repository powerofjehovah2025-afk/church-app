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
import { Loader2, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import type { Attendance, Service } from "@/types/database.types";

interface AttendanceWithService extends Attendance {
  service?: Service;
}

export function AttendanceView() {
  const [attendance, setAttendance] = useState<AttendanceWithService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedServiceId) params.append("service_id", selectedServiceId);

      const response = await fetch(`/api/member/attendance?${params.toString()}`);
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

  useEffect(() => {
    fetchAttendance();
    fetchServices();
  }, [fetchAttendance, fetchServices]);

  const handleCheckIn = async (serviceId: string) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/member/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to check in");
      }

      setMessage({
        type: "success",
        text: "Checked in successfully!",
      });

      fetchAttendance();
    } catch (error) {
      console.error("Error checking in:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to check in",
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

  const upcomingServices = services.filter((s) => {
    const serviceDate = new Date(s.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return serviceDate >= today;
  }).slice(0, 5);

  const hasCheckedIn = (serviceId: string) => {
    return attendance.some((a) => a.service_id === serviceId && a.status === "present");
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
              <CardTitle className="text-white">My Attendance</CardTitle>
              <CardDescription className="text-slate-400">
                View your attendance records and check in to services
              </CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          {upcomingServices.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Upcoming Services</h3>
              <div className="space-y-2">
                {upcomingServices.map((service) => (
                  <Card key={service.id} className="border-slate-800 bg-slate-800/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{service.name}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(service.date).toLocaleDateString()}
                            {service.time && ` at ${service.time}`}
                          </p>
                        </div>
                        {hasCheckedIn(service.id) ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                            Checked In
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(service.id)}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

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
                            {record.service?.name || "Unknown Service"}
                          </h3>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>
                            Date: {record.service?.date
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
    </div>
  );
}

