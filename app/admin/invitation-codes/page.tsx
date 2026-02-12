import { InvitationCodesManager } from "@/components/admin/invitation-codes-manager";

export default function AdminInvitationCodesPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-foreground">
      <div className="mx-auto max-w-7xl p-6 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Invitation Codes
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Invitation codes are required for new sign-ups. Create codes here and share them with new members.
          </p>
        </div>

        <InvitationCodesManager />
      </div>
    </div>
  );
}
