"use client";

import { EventsManager } from "@/components/admin/events-manager";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        <EventsManager />
      </div>
    </div>
  );
}

