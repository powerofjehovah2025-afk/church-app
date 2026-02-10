"use client";

import { StaffDirectory } from "@/components/admin/staff-directory";

export default function StaffDirectoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Staff Directory</h1>
        <p className="text-slate-400">
          View staff members and their current workload
        </p>
      </div>
      <StaffDirectory />
    </div>
  );
}

