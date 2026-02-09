"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckSquare, Mail, Calendar, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
}

export function MemberDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [duties, setDuties] = useState<ServiceAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

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
          service:services(id, date, name, time),
          duty_type:duty_types(id, name)
        `)
        .eq("member_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching duties:", error);
        return;
      }

      setDuties((data as ServiceAssignment[]) || []);
    } catch (error) {
      console.error("Error fetching duties:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchMessages(), fetchDuties()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchTasks, fetchMessages, fetchDuties]);

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
      pending: "bg-slate-500/20 text-slate-300 border-slate-500/50",
      in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      completed: "bg-green-500/20 text-green-300 border-green-500/50",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/50",
      confirmed: "bg-green-500/20 text-green-300 border-green-500/50",
      declined: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return colors[status] || colors.pending;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  const unreadMessagesCount = messages.filter((m) => !m.is_read).length;
  const pendingTasksCount = tasks.filter((t) => t.status === "pending").length;
  const upcomingDutiesCount = duties.filter((d) => d.status === "confirmed").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingTasksCount}</div>
            <p className="text-xs text-slate-400">Pending tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Messages</CardTitle>
            <Mail className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{unreadMessagesCount}</div>
            <p className="text-xs text-slate-400">Unread messages</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Duties</CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{upcomingDutiesCount}</div>
            <p className="text-xs text-slate-400">Upcoming duties</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white">My Dashboard</CardTitle>
          <CardDescription className="text-slate-400">
            View your tasks, messages, and assigned duties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600">
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-blue-600">
                Messages ({messages.length})
                {unreadMessagesCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs">
                    {unreadMessagesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="duties" className="data-[state=active]:bg-blue-600">
                Duties ({duties.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="text-white font-medium">{task.title}</h3>
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
                            <p className="text-sm text-slate-400 mb-2">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-slate-500">
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
                            <SelectTrigger className="w-[140px] bg-slate-700/50 border-slate-600/50 text-white text-xs">
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
                  <Mail className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border ${
                        msg.is_read
                          ? "bg-slate-800/30 border-slate-700/30"
                          : "bg-slate-800/50 border-slate-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="text-white font-medium">{msg.subject}</h3>
                            {!msg.is_read && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/50">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2 whitespace-pre-wrap">
                            {msg.body}
                          </p>
                          <p className="text-xs text-slate-500">
                            From: {msg.sender?.full_name || msg.sender?.email || "Unknown"} •{" "}
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!msg.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkMessageAsRead(msg.id)}
                            className="border-slate-700"
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="duties" className="mt-4">
              {duties.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No duties assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {duties.map((duty) => (
                    <div
                      key={duty.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">
                            {duty.service.name} - {duty.duty_type.name}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            {new Date(duty.service.date).toLocaleDateString()}
                            {duty.service.time && ` at ${duty.service.time}`}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(duty.status)}`}
                        >
                          {duty.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

