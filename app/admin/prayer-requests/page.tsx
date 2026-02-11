"use client";

import { PrayerRequestsManager } from "@/components/admin/prayer-requests-manager";

export default function PrayerRequestsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        <PrayerRequestsManager />
      </div>
    </div>
  );
}

