"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface Reminder {
  id: string;
  newcomer_id: string;
  staff_id: string;
  reminder_type: string;
  reminder_date: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  newcomer?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    followup_status: string | null;
  };
  staff?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export function FollowupReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("overdue");

  useEffect(() => {
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType === "overdue") {
        params.append("is_sent", "false");
      }
      params.append("reminder_type", filterType === "overdue" ? "overdue" : "");

      const response = await fetch(`/api/admin/followups/reminders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      } else {
        console.error("Failed to fetch reminders");
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleReassign = async (reminderId: string, newStaffId: string) => {
  //   try {
  //     // This would require an API endpoint to reassign
  //     // For now, just show a message
  //     alert("Reassignment feature coming soon");
  //   } catch (error) {
  //     console.error("Error reassigning:", error);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const overdueReminders = reminders.filter((r) => {
    if (r.is_sent) return false;
    const reminderDate = new Date(r.reminder_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reminderDate <= today;
  });

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            Overdue Follow-ups
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReminders}
              className="border-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {overdueReminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No overdue follow-ups</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueReminders.map((reminder) => (
                <Card
                  key={reminder.id}
                  className="bg-slate-800/50 border-red-500/30"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium">
                            {reminder.newcomer?.full_name || "Unknown"}
                          </h3>
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                            Overdue
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>
                            Assigned to:{" "}
                            <span className="text-white">
                              {reminder.staff?.full_name || reminder.staff?.email || "Unknown"}
                            </span>
                          </p>
                          {reminder.newcomer?.phone && (
                            <p>Phone: {reminder.newcomer.phone}</p>
                          )}
                          {reminder.newcomer?.email && (
                            <p>Email: {reminder.newcomer.email}</p>
                          )}
                          <p>
                            Reminder Date: {new Date(reminder.reminder_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-xs"
                          onClick={() => {
                            window.location.href = `/admin/newcomers`;
                          }}
                        >
                          View Details
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
    </div>
  );
}
