"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Mail, CheckCircle2, AlertCircle, User } from "lucide-react";

interface StaffMember {
  staff_id: string;
  staff_name: string;
  staff_email: string | null;
  role: string | null;
  current_assignments: number;
  completed_this_week: number;
  active_tasks: number;
  response_rate: number;
}

export function StaffDirectory() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/staff/directory");
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        console.error("Failed to fetch staff");
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string | null) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      pastor: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      elder: "bg-green-500/20 text-green-300 border-green-500/50",
      deacon: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      leader: "bg-orange-500/20 text-orange-300 border-orange-500/50",
    };
    return colors[role || ""] || "bg-slate-500/20 text-slate-300 border-slate-500/50";
  };

  const getResponseRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card
            key={member.staff_id}
            className="bg-slate-900/40 border-slate-700/50 hover:border-slate-600/50 transition-colors"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-white mb-2">
                    {member.staff_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getRoleColor(member.role)}>
                      {member.role || "Member"}
                    </Badge>
                  </div>
                </div>
                <User className="h-8 w-8 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.staff_email && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span>{member.staff_email}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="h-3 w-3" />
                    Assignments
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {member.current_assignments}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="h-3 w-3" />
                    This Week
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {member.completed_this_week}
                  </div>
                </div>
              </div>

              {member.active_tasks > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-slate-300">
                    {member.active_tasks} active task{member.active_tasks !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {member.current_assignments > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Response Rate</span>
                    <span className={`font-semibold ${getResponseRateColor(member.response_rate)}`}>
                      {member.response_rate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-700 text-xs"
                  onClick={() => {
                    window.location.href = `/admin/reports/followups?staff_id=${member.staff_id}`;
                  }}
                >
                  View Assignments
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-700 text-xs"
                  onClick={() => {
                    window.location.href = `/admin/messages?to=${member.staff_id}`;
                  }}
                >
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {staff.length === 0 && (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400">No staff members found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

