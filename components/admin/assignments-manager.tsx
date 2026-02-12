"use client";

import { TaskAssignment } from "@/components/admin/task-assignment";

/**
 * Thin wrapper so the rota page can render task assignments
 * under the "Assignments" tab.
 */
export function AssignmentsManager() {
  return <TaskAssignment />;
}

export default AssignmentsManager;

