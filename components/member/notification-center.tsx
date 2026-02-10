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
import { Loader2, Bell, Trash2, Check, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database.types";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const params = new URLSearchParams();
      params.append("user_id", user.id);
      params.append("limit", "50");

      if (filter === "unread") {
        params.append("is_read", "false");
      } else if (filter === "read") {
        params.append("is_read", "true");
      }

      const response = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/admin/notifications/${n.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_read: true }),
          })
        )
      );
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      message: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      task_assigned: "bg-green-500/20 text-green-300 border-green-500/50",
      task_completed: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      duty_assigned: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      duty_reminder: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      system: "bg-slate-500/20 text-slate-300 border-slate-500/50",
    };
    return colors[type] || colors.system;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="border-slate-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No notifications found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`bg-slate-900/40 border-slate-700/50 ${
                !notification.is_read ? "border-blue-500/30 bg-blue-500/5" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{notification.title}</h3>
                      {!notification.is_read && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-xs">
                          New
                        </Badge>
                      )}
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">{notification.message}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                    {notification.link && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          window.location.href = notification.link || "/dashboard";
                        }}
                        className="text-blue-400 p-0 h-auto mt-2"
                      >
                        View →
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="border-slate-700"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="border-red-700 text-red-400 hover:bg-red-500/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

