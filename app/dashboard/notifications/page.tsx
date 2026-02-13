"use client";

import { NotificationCenter } from "@/components/member/notification-center";

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">Notifications</h2>
        <p className="text-muted-foreground text-sm">View and manage your notifications</p>
      </div>
      <NotificationCenter />
    </div>
  );
}

