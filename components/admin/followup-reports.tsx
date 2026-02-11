"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, Filter, TrendingUp, Users, Clock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FollowupStats {
  totalAssigned: number;
  statusBreakdown: Record<string, number>;
  staffBreakdown: Array<{
    staff_id: string;
    staff_name: string;
    assigned_count: number;
    completed_count: number;
    completion_rate: number;
  }>;
  overdueCount: number;
  averageResponseTimeHours: number;
  averageResponseTimeDays: number;
  completionRate: number;
  newcomers: Array<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    status: string | null;
    followup_status: string | null;
    followup_count: number | null;
    last_followup_at: string | null;
    assigned_at: string | null;
    created_at: string;
    staff?: {
      id: string;
      full_name: string | null;
      email: string | null;
    };
  }>;
}

export function FollowupReports() {
  const [stats, setStats] = useState<FollowupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffId, setStaffId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);

  useEffect(() => {
    fetchStaffMembers();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, status, startDate, endDate, showOverdueOnly]);

  const fetchStaffMembers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "member"]);

      if (error) {
        console.error("Error fetching staff members:", error);
        return;
      }

      setStaffMembers(data || []);
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (staffId) params.append("staff_id", staffId);
      if (status) params.append("status", status);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(`/api/admin/reports/followups?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Failed to fetch stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Follow-up Status",
      "Follow-up Count",
      "Last Follow-up",
      "Assigned To",
      "Assigned At",
    ];

    const rows = stats.newcomers.map((n) => [
      n.full_name,
      n.email || "",
      n.phone || "",
      n.status || "",
      n.followup_status || "not_started",
      (n.followup_count || 0).toString(),
      n.last_followup_at ? new Date(n.last_followup_at).toLocaleString() : "",
      n.staff?.full_name || n.staff?.email || "",
      n.assigned_at ? new Date(n.assigned_at).toLocaleString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `followup-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-slate-500/20 text-slate-300 border-slate-500/50",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      contacted: "bg-green-500/20 text-green-300 border-green-500/50",
      completed: "bg-green-500/20 text-green-300 border-green-500/50",
      no_response: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[status] || colors.not_started;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      contacted: "Contacted",
      completed: "Completed",
      no_response: "No Response",
    };
    return labels[status] || status;
  };

  const filteredNewcomers = showOverdueOnly && stats
    ? stats.newcomers.filter((n) => {
        if (n.followup_status === "contacted" || n.followup_status === "completed") {
          return false;
        }
        const assignedAt = n.assigned_at ? new Date(n.assigned_at) : new Date(n.created_at);
        const hoursSinceAssignment = (Date.now() - assignedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceAssignment > 48;
      })
    : stats?.newcomers || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Assigned</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalAssigned}</div>
            <p className="text-xs text-slate-400">Newcomers assigned</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">Successfully contacted</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.averageResponseTimeDays.toFixed(1)}d
            </div>
            <p className="text-xs text-slate-400">
              {stats.averageResponseTimeHours.toFixed(1)} hours
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.overdueCount}</div>
            <p className="text-xs text-slate-400">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label className="text-slate-300">Staff Member</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All staff</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name || staff.email || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50"
              />
            </div>

            <div>
              <Label className="text-slate-300">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700/50"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className={`w-full border-slate-700 ${showOverdueOnly ? "bg-red-500/20 border-red-500/50" : ""}`}
              >
                {showOverdueOnly ? "Show All" : "Overdue Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <Badge
                key={status}
                className={`${getStatusColor(status)} px-3 py-1`}
              >
                {getStatusLabel(status)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance */}
      {stats.staffBreakdown.length > 0 && (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
                    <TableHead className="text-slate-300">Staff Member</TableHead>
                    <TableHead className="text-slate-300">Assigned</TableHead>
                    <TableHead className="text-slate-300">Completed</TableHead>
                    <TableHead className="text-slate-300">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.staffBreakdown.map((staff) => (
                    <TableRow key={staff.staff_id} className="border-slate-700/50">
                      <TableCell className="text-white">{staff.staff_name}</TableCell>
                      <TableCell className="text-slate-300">{staff.assigned_count}</TableCell>
                      <TableCell className="text-slate-300">{staff.completed_count}</TableCell>
                      <TableCell className="text-slate-300">
                        {staff.completion_rate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-ups Table */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Follow-ups</CardTitle>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="border-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Contact</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Follow-up Status</TableHead>
                  <TableHead className="text-slate-300">Follow-ups</TableHead>
                  <TableHead className="text-slate-300">Last Follow-up</TableHead>
                  <TableHead className="text-slate-300">Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNewcomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      No follow-ups found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNewcomers.map((newcomer) => (
                    <TableRow key={newcomer.id} className="border-slate-700/50">
                      <TableCell className="text-white font-medium">
                        {newcomer.full_name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="text-xs">
                          {newcomer.email && <div>{newcomer.email}</div>}
                          {newcomer.phone && <div>{newcomer.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {newcomer.status || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(newcomer.followup_status || "not_started")}>
                          {getStatusLabel(newcomer.followup_status || "not_started")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {newcomer.followup_count || 0}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {newcomer.last_followup_at
                          ? new Date(newcomer.last_followup_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {newcomer.staff?.full_name || newcomer.staff?.email || "Unassigned"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
