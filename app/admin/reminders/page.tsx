"use client";

import { FollowupReminders } from "@/components/admin/followup-reminders";

export default function RemindersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Follow-up Reminders</h1>
        <p className="text-slate-400">
          View and manage overdue follow-up reminders
        </p>
      </div>
      <FollowupReminders />
    </div>
  );
}
