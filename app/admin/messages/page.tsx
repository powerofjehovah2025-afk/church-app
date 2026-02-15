import { Messaging } from "@/components/admin/messaging";

export default function AdminMessagesPage() {
  return (
    <div className="min-h-screen min-w-0 w-full max-w-full bg-[#0f172a] text-foreground">
      <div className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6 pb-24">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Messaging
          </h1>
          <p className="text-slate-400 mt-1 sm:mt-2 text-base sm:text-lg text-pretty break-words">
            Send messages and communicate with members
          </p>
        </div>

        <Messaging />
      </div>
    </div>
  );
}

