import { TaskAssignment } from "@/components/admin/task-assignment";

export default function AdminTasksPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Task Assignment
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Assign duties and responsibilities to members
          </p>
        </div>

        <TaskAssignment />
      </div>
    </div>
  );
}

