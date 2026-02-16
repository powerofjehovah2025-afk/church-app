"use client";

import { EventsManager } from "@/components/admin/events-manager";

export default function EventsPage() {
  return (
    <div className="min-h-screen min-w-0 w-full max-w-full bg-[#0f172a] text-foreground">
      <div className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6 pb-24">
        <EventsManager />
      </div>
    </div>
  );
}

