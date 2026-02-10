"use client";

import { FollowupReports } from "@/components/admin/followup-reports";

export default function FollowupReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Follow-up Reports</h1>
        <p className="text-slate-400">
          Track follow-up performance and engagement metrics
        </p>
      </div>
      <FollowupReports />
    </div>
  );
}
