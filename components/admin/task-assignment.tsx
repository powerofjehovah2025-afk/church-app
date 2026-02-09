"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, CheckCircle2, AlertCircle, Calendar, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  assigned_to_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  assigned_by_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export function TaskAssignment() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        return;
      }

      setMembers((data as Profile[]) || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filterStatus === "all"
        ? "/api/admin/tasks"
        : `/api/admin/tasks?status=${filterStatus}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load tasks",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchMembers();
    fetchTasks();
  }, [fetchMembers, fetchTasks]);

  const handleOpenDialog = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
    setDueDate("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
    setDueDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to assign tasks");
      }

      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || null,
          assigned_to: assignedTo,
          assigned_by: user.id,
          priority,
          due_date: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      setMessage({
        type: "success",
        text: "Task assigned successfully!",
      });

      handleCloseDialog();
      await fetchTasks();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to assign task",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update task");
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
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

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Card
          className={`${
            message.type === "success"
              ? "bg-green-500/20 border-green-500/50"
              : "bg-red-500/20 border-red-500/50"
          } backdrop-blur-md shadow-xl`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <p
                className={
                  message.type === "success" ? "text-green-300" : "text-red-300"
                }
              >
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-white">Task Assignment</CardTitle>
              <CardDescription className="text-slate-400">
                Assign duties and responsibilities to members
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleOpenDialog}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Assign New Task</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Assign a duty or responsibility to a member
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-white">
                          Task Title *
                        </Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Prepare Sunday Service Program"
                          className="bg-slate-800 border-slate-700 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-white">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Provide details about the task..."
                          className="bg-slate-800 border-slate-700 text-white"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="assigned_to" className="text-white">
                            Assign To *
                          </Label>
                          <Select value={assignedTo} onValueChange={setAssignedTo} required>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.full_name || member.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority" className="text-white">
                            Priority *
                          </Label>
                          <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-white">
                          Due Date
                        </Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        className="border-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          "Assign Task"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No tasks found</p>
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
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            To: {task.assigned_to_profile?.full_name || task.assigned_to_profile?.email || "Unknown"}
                          </span>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status !== "completed" && task.status !== "cancelled" && (
                        <Select
                          value={task.status}
                          onValueChange={(newStatus) => handleStatusUpdate(task.id, newStatus)}
                        >
                          <SelectTrigger className="w-[140px] bg-slate-700/50 border-slate-600/50 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
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

