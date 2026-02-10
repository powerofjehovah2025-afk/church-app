"use client";

import { NotificationCenter } from "@/components/member/notification-center";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-4xl p-6 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-slate-400">View and manage your notifications</p>
        </div>
        <NotificationCenter />
      </div>
    </div>
  );
}

