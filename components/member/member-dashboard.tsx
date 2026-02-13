"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckSquare, Mail, Calendar, User, Phone, MessageCircle, Edit, Save, X, AlertCircle, Megaphone, Pin, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/types/database.types";
import { MemberCalendar } from "./member-calendar";
import { ProfileEditor } from "./profile-editor";
import { PrayerRequests } from "./prayer-requests";
import { EventsList } from "./events-list";
import { FeedbackForm } from "./feedback-form";
import { AttendanceView } from "./attendance-view";
import { ContributionsView } from "./contributions-view";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  assigned_by_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface Message {
  id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface ServiceAssignment {
  id: string;
  service: {
    id: string;
    date: string;
    name: string;
    time: string | null;
  };
  duty_type: {
    id: string;
    name: string;
  };
  status: string;
  notes: string | null;
}

interface AssignedNewcomer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  followup_status: string | null;
  followup_notes: string | null;
  last_followup_at: string | null;
  followup_count: number | null;
  next_followup_date: string | null;
  created_at: string;
  assigned_to?: string | null;
  assigned_at?: string | null;
}

interface FollowupHistory {
  id: string;
  status: string;
  notes: string | null;
  contact_method: string | null;
  created_at: string;
  staff?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export function MemberDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [duties, setDuties] = useState<ServiceAssignment[]>([]);
  const [assignedNewcomers, setAssignedNewcomers] = useState<AssignedNewcomer[]>([]);
  const [followupHistory, setFollowupHistory] = useState<Record<string, FollowupHistory[]>>({});
  const [editingNewcomerId, setEditingNewcomerId] = useState<string | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const validTabIds = ["tasks", "messages", "duties", "calendar", "followups", "feedback", "attendance", "contributions", "profile", "prayer", "events"];
  const [activeTabState, setActiveTabState] = useState("tasks");
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const activeTab = validTabIds.includes(tabFromUrl || "") ? tabFromUrl! : activeTabState;
  const setActiveTab = useCallback((value: string) => {
    setActiveTabState(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false });
  }, [router]);

  useEffect(() => {
    if (tabFromUrl && validTabIds.includes(tabFromUrl)) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);

  // When opening a tab via URL (e.g. "View Events" / "View Rota" links), scroll tabs into view
  useEffect(() => {
    if (!tabFromUrl || !validTabIds.includes(tabFromUrl)) return;
    const el = document.querySelector("[data-member-dashboard-tabs]");
    if (el) {
      const id = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [tabFromUrl]);

  const fetchTasks = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const response = await fetch(`/api/admin/tasks?assigned_to=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const response = await fetch(`/api/admin/messages?recipient_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const fetchDuties = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("service_assignments")
        .select(`
          id,
          status,
          notes,
          service:services(id, date, name, time),
          duty_type:duty_types(id, name)
        `)
        .eq("member_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching duties:", error);
        return;
      }

      const dutiesData = (data as ServiceAssignment[]) || [];
      dutiesData.sort((a, b) => {
        const dateA = new Date(a.service.date).getTime();
        const dateB = new Date(b.service.date).getTime();
        return dateA - dateB;
      });
      setDuties(dutiesData);
    } catch (error) {
      console.error("Error fetching duties:", error);
    }
  }, []);

  const fetchAssignedNewcomers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("newcomers")
        .select("id, full_name, email, phone, status, followup_status, followup_notes, last_followup_at, followup_count, next_followup_date, assigned_at, created_at")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching assigned newcomers:", error);
        return;
      }

      const newcomers = (data as AssignedNewcomer[]) || [];
      setAssignedNewcomers(newcomers);

      // Fetch follow-up history for each newcomer
      const historyPromises = newcomers.map(async (newcomer) => {
        const response = await fetch(`/api/admin/newcomers/${newcomer.id}/followup`);
        if (response.ok) {
          const historyData = await response.json();
          return { newcomerId: newcomer.id, history: historyData.history || [] };
        }
        return { newcomerId: newcomer.id, history: [] };
      });

      const historyResults = await Promise.all(historyPromises);
      const historyMap: Record<string, FollowupHistory[]> = {};
      historyResults.forEach(({ newcomerId, history }) => {
        historyMap[newcomerId] = history;
      });
      setFollowupHistory(historyMap);

      // Calculate overdue count (assigned more than 48 hours ago and not contacted)
      const now = new Date();
      const overdue = newcomers.filter((n) => {
        if (!n.assigned_to || n.followup_status === "contacted" || n.followup_status === "completed") {
          return false;
        }
        const assignedAt = n.assigned_at ? new Date(n.assigned_at) : new Date(n.created_at);
        const hoursSinceAssignment = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceAssignment > 48;
      });
      setOverdueCount(overdue.length);

      // Fetch pending reminders for this user
      try {
        const remindersResponse = await fetch(`/api/admin/followups/reminders?staff_id=${user.id}&is_sent=false`);
        if (remindersResponse.ok) {
          const remindersData = await remindersResponse.json();
          const pendingReminders = remindersData.reminders || [];
          // Add reminder count to overdue count if there are reminders
          if (pendingReminders.length > 0) {
            setOverdueCount((prev) => prev + pendingReminders.length);
          }
        }
      } catch (error) {
        console.error("Error fetching reminders:", error);
      }
    } catch (error) {
      console.error("Error fetching assigned newcomers:", error);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Get user's role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profile as { role?: string } | null)?.role || "member";
      setUserRole(role);

      // Fetch announcements for user's role or "all"
      const params = new URLSearchParams();
      params.append("include_expired", "false");

      const response = await fetch(`/api/admin/announcements?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Filter by target audience (all or user's role)
        const filtered = (data.announcements || []).filter(
          (ann: Announcement) => ann.target_audience === "all" || ann.target_audience === role
        );
        setAnnouncements(filtered);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const response = await fetch(`/api/admin/notifications?user_id=${user.id}&is_read=false&limit=1`);
      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationCount(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchMessages(), fetchDuties(), fetchAssignedNewcomers(), fetchAnnouncements(), fetchNotifications()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchTasks, fetchMessages, fetchDuties, fetchAssignedNewcomers, fetchAnnouncements, fetchNotifications]);

  useEffect(() => {
    const POLL_INTERVAL_MS = 75000;
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void fetchTasks();
      void fetchMessages();
      void fetchDuties();
      void fetchAssignedNewcomers();
      void fetchAnnouncements();
      void fetchNotifications();
    };
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchTasks, fetchMessages, fetchDuties, fetchAssignedNewcomers, fetchAnnouncements, fetchNotifications]);

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleSendReply = async (messageId: string) => {
    if (!replyBody.trim()) return;
    setIsSendingReply(true);
    try {
      const response = await fetch("/api/member/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, body: replyBody.trim() }),
      });
      if (response.ok) {
        setReplyingToMessageId(null);
        setReplyBody("");
        await fetchMessages();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply. Please try again.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      high: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      urgent: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-muted text-muted-foreground border-border",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      completed: "bg-green-500/20 text-green-300 border-green-500/50",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/50",
      confirmed: "bg-green-500/20 text-green-300 border-green-500/50",
      scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      declined: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[status] || colors.pending;
  };

  const getFollowupStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-muted text-muted-foreground border-border",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      contacted: "bg-green-500/20 text-green-300 border-green-500/50",
      completed: "bg-green-500/20 text-green-300 border-green-500/50",
      no_response: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[status] || colors.not_started;
  };

  const getFollowupStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      contacted: "Contacted",
      completed: "Completed",
      no_response: "No Response",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  const unreadMessagesCount = messages.filter((m) => !m.is_read).length;
  const pendingTasksCount = tasks.filter((t) => t.status === "pending").length;
  const upcomingDutiesCount = duties.filter((d) => d.status === "confirmed").length;
  const assignedNewcomersCount = assignedNewcomers.length;
  const hasOverdueFollowups = overdueCount > 0;

  return (
    <div className="space-y-4 sm:space-y-6 w-full mx-auto px-0 sm:px-4 md:px-6 pb-6">
      {/* Overdue Follow-ups Alert */}
      {hasOverdueFollowups && (
        <Card className="bg-red-500/10 border-red-500/30 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">
                  {overdueCount} overdue follow-up{overdueCount !== 1 ? 's' : ''} need attention
                </p>
                <p className="text-red-400/70 text-sm mt-1">
                  These newcomers were assigned more than 48 hours ago and haven&apos;t been contacted yet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <Card className="bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    announcement.is_pinned
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-muted border-border"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {announcement.is_pinned && (
                      <Pin className="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <h3 className="text-card-foreground font-semibold">{announcement.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap mb-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleDateString()}
                    {announcement.expires_at && (
                      <> • Expires: {new Date(announcement.expires_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground">Pending tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
            <Mail className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{unreadMessagesCount}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duties</CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{upcomingDutiesCount}</div>
            <p className="text-xs text-muted-foreground">Upcoming duties</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follow-ups</CardTitle>
            <User className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{assignedNewcomersCount}</div>
            <p className="text-xs text-muted-foreground">Assigned newcomers</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-card-foreground">{unreadNotificationCount}</div>
                <p className="text-xs text-muted-foreground">Unread notifications</p>
              </div>
              {unreadNotificationCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.location.href = "/dashboard/notifications"}
                  className="text-blue-400 p-0 h-auto"
                >
                  View →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="bg-card border-border shadow-xl" data-member-dashboard-tabs>
        <CardHeader>
          <CardTitle className="text-card-foreground">My Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground">
            View your tasks, messages, assigned duties, and follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex flex-nowrap overflow-x-auto no-scrollbar bg-muted min-h-[44px]">
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Messages ({messages.length})
                {unreadMessagesCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
                    {unreadMessagesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="duties"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Duties ({duties.length})
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="followups"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Follow-ups ({assignedNewcomers.length})
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Feedback
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="contributions"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                Contributions
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-blue-600 text-xs sm:text-sm px-3 py-2.5 min-h-[44px] whitespace-nowrap flex-shrink-0"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg bg-muted border border-border"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                            <h3 className="text-card-foreground font-medium">{task.title}</h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {task.status !== "completed" && task.status !== "cancelled" && (
                          <Select
                            value={task.status}
                            onValueChange={(newStatus) =>
                              handleTaskStatusUpdate(task.id, newStatus)
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px] bg-muted border-border text-foreground text-xs flex-shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border ${
                        msg.is_read
                          ? "bg-muted/50 border-border"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                            <h3 className="text-card-foreground font-medium">{msg.subject}</h3>
                            {!msg.is_read && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/50">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap break-words">
                            {msg.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From: {msg.sender?.full_name || msg.sender?.email || "Unknown"} •{" "}
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!msg.is_read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkMessageAsRead(msg.id)}
                              className="border-border w-full sm:w-auto min-h-[44px] sm:min-h-0"
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingToMessageId(replyingToMessageId === msg.id ? null : msg.id);
                              setReplyBody("");
                            }}
                            className="border-border w-full sm:w-auto min-h-[44px] sm:min-h-0"
                          >
                            {replyingToMessageId === msg.id ? "Cancel" : "Reply"}
                          </Button>
                        </div>
                      </div>
                      {replyingToMessageId === msg.id && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <Label htmlFor={`reply-${msg.id}`} className="text-xs text-muted-foreground">Your reply</Label>
                          <Textarea
                            id={`reply-${msg.id}`}
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Type your reply..."
                            className="min-h-[80px] bg-muted border-border"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSendReply(msg.id)}
                            disabled={!replyBody.trim() || isSendingReply}
                          >
                            {isSendingReply ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              "Send Reply"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="duties" className="mt-4">
              {duties.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No duties assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {duties.map((duty) => {
                    const serviceDate = new Date(duty.service.date);
                    const isUpcoming = serviceDate >= new Date();
                    const isPast = serviceDate < new Date();
                    return (
                      <div
                        key={duty.id}
                        className={`p-4 rounded-lg border ${
                          isUpcoming
                            ? "bg-blue-500/10 border-blue-500/30"
                            : isPast
                            ? "bg-muted/50 border-border opacity-75"
                            : "bg-muted border-border"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-card-foreground font-medium">
                                {duty.duty_type.name}
                              </h3>
                              <span className="text-muted-foreground hidden sm:inline">•</span>
                              <span className="text-muted-foreground text-sm">{duty.service.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {serviceDate.toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {duty.service.time && (
                                <span className="ml-0 sm:ml-2">at {duty.service.time}</span>
                              )}
                            </p>
                            {duty.notes && (
                              <p className="text-xs text-muted-foreground mt-2 italic break-words">
                                {duty.notes}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap self-start ${getStatusColor(duty.status)}`}
                          >
                            {duty.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <MemberCalendar />
            </TabsContent>

            <TabsContent value="feedback" className="mt-4">
              <FeedbackForm />
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <AttendanceView />
            </TabsContent>

            <TabsContent value="contributions" className="mt-4">
              <ContributionsView />
            </TabsContent>

            <TabsContent value="profile" className="mt-4">
              <ProfileEditor />
            </TabsContent>

            <TabsContent value="prayer" className="mt-4">
              <PrayerRequests />
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              <EventsList />
            </TabsContent>

            <TabsContent value="followups" className="mt-4">
              {assignedNewcomers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No follow-ups assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedNewcomers.map((newcomer) => {
                    const isEditing = editingNewcomerId === newcomer.id;
                    const history = followupHistory[newcomer.id] || [];
                    const followupStatus = newcomer.followup_status || "not_started";
                    
                    // Calculate if overdue (assigned more than 48 hours ago and not contacted/completed)
                    const now = new Date();
                    const assignedAt = newcomer.assigned_at ? new Date(newcomer.assigned_at) : new Date(newcomer.created_at);
                    const hoursSinceAssignment = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
                    const isOverdue = hoursSinceAssignment > 48 && 
                      followupStatus !== "contacted" && 
                      followupStatus !== "completed";
                    
                    return (
                      <div
                        key={newcomer.id}
                        className={`p-4 rounded-lg border ${
                          isOverdue 
                            ? "bg-red-500/10 border-red-500/30" 
                            : "bg-muted border-border"
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-card-foreground font-medium">{newcomer.full_name}</h3>
                                {isOverdue && (
                                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px]">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              {newcomer.email && (
                                <p className="text-sm text-muted-foreground mt-1">{newcomer.email}</p>
                              )}
                              {newcomer.phone && (
                                <p className="text-sm text-muted-foreground">{newcomer.phone}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Added: {new Date(newcomer.created_at).toLocaleDateString()}
                                {newcomer.followup_count && newcomer.followup_count > 0 && (
                                  <> • {newcomer.followup_count} follow-up{newcomer.followup_count !== 1 ? 's' : ''}</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(newcomer.status || "New")}`}
                              >
                                {newcomer.status || "New"}
                              </span>
                              {!isEditing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingNewcomerId(newcomer.id)}
                                  className="border-border"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          {!isEditing && (
                            <div className="flex gap-2 flex-wrap">
                              {newcomer.phone && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.location.href = `tel:${newcomer.phone?.replace(/\D/g, '')}`}
                                    className="border-border text-xs"
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const firstName = newcomer.full_name.split(" ")[0] || newcomer.full_name;
                                      const message = `Hi ${firstName}, it was a blessing having you at POJ Essex today! How can we pray for you this week?`;
                                      const encodedMessage = encodeURIComponent(message);
                                      const phoneNumber = newcomer.phone?.replace(/\D/g, '');
                                      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
                                    }}
                                    className="border-border text-xs"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    WhatsApp
                                  </Button>
                                </>
                              )}
                              {newcomer.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = `mailto:${newcomer.email}`}
                                  className="border-border text-xs"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Follow-up Status and Notes */}
                          {isEditing ? (
                            <FollowupEditor
                              newcomer={newcomer}
                              onSave={async (status, notes, contactMethod, nextDate) => {
                                try {
                                  const response = await fetch(`/api/admin/newcomers/${newcomer.id}/followup`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      followup_status: status,
                                      followup_notes: notes,
                                      contact_method: contactMethod || null,
                                      next_followup_date: nextDate || null,
                                    }),
                                  });

                                  if (response.ok) {
                                    const data = await response.json();
                                    // Update local state immediately
                                    setAssignedNewcomers((prev) =>
                                      prev.map((n) =>
                                        n.id === newcomer.id
                                          ? {
                                              ...n,
                                              followup_status: status,
                                              followup_notes: notes,
                                              last_followup_at: new Date().toISOString(),
                                              followup_count: (n.followup_count || 0) + 1,
                                              next_followup_date: nextDate || null,
                                            }
                                          : n
                                      )
                                    );
                                    // Refresh history
                                    if (data.historyEntry) {
                                      setFollowupHistory((prev) => ({
                                        ...prev,
                                        [newcomer.id]: [
                                          data.historyEntry,
                                          ...(prev[newcomer.id] || []),
                                        ],
                                      }));
                                    }
                                    setEditingNewcomerId(null);
                                  } else {
                                    const errorData = await response.json();
                                    console.error("Error updating follow-up:", errorData);
                                    alert(errorData.error || "Failed to update follow-up");
                                  }
                                } catch (error) {
                                  console.error("Error updating follow-up:", error);
                                  alert("Failed to update follow-up. Please try again.");
                                }
                              }}
                              onCancel={() => setEditingNewcomerId(null)}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Follow-up Status:</Label>
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getFollowupStatusColor(followupStatus)}`}>
                                  {getFollowupStatusLabel(followupStatus)}
                                </span>
                              </div>
                              {newcomer.followup_notes && (
                                <div className="bg-muted rounded p-3 border border-border">
                                  <Label className="text-xs text-muted-foreground mb-1 block">Notes:</Label>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{newcomer.followup_notes}</p>
                                </div>
                              )}
                              {newcomer.last_followup_at && (
                                <p className="text-xs text-muted-foreground">
                                  Last follow-up: {new Date(newcomer.last_followup_at).toLocaleString()}
                                </p>
                              )}
                              {newcomer.next_followup_date && (
                                <p className="text-xs text-muted-foreground">
                                  Next follow-up: {new Date(newcomer.next_followup_date).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          )}

                          {/* Follow-up History */}
                          {history.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Label className="text-xs text-muted-foreground mb-2 block">Follow-up History:</Label>
                              <div className="space-y-2">
                                {history.slice(0, 3).map((entry) => (
                                  <div key={entry.id} className="text-xs bg-muted rounded p-2 border border-border">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getFollowupStatusColor(entry.status)}`}>
                                        {getFollowupStatusLabel(entry.status)}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {new Date(entry.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {entry.contact_method && (
                                      <p className="text-muted-foreground text-[10px]">Method: {entry.contact_method}</p>
                                    )}
                                    {entry.notes && (
                                      <p className="text-muted-foreground text-[10px] mt-1">{entry.notes}</p>
                                    )}
                                  </div>
                                ))}
                                {history.length > 3 && (
                                  <p className="text-xs text-muted-foreground">+ {history.length - 3} more entries</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Follow-up Editor Component
function FollowupEditor({
  newcomer,
  onSave,
  onCancel,
}: {
  newcomer: AssignedNewcomer;
  onSave: (status: string, notes: string, contactMethod: string, nextDate: string | null) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState(newcomer.followup_status || "not_started");
  const [notes, setNotes] = useState(newcomer.followup_notes || "");
  const [contactMethod, setContactMethod] = useState<string>("");
  const [nextDate, setNextDate] = useState<string>(newcomer.next_followup_date || "");

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Follow-up Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-muted border-border text-foreground text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no_response">No Response</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Contact Method (Optional)</Label>
        <Select value={contactMethod} onValueChange={setContactMethod}>
          <SelectTrigger className="bg-muted border-border text-foreground text-xs">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="visit">Visit</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-muted border-border text-foreground text-xs"
          rows={3}
          placeholder="Add follow-up notes..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Next Follow-up Date (Optional)</Label>
        <Input
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          className="bg-muted border-border text-foreground text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(status, notes, contactMethod, nextDate || null)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="border-border text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

