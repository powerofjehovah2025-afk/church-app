import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
            RCCG Power of Jehovah
          </h1>
          <p className="text-slate-400 text-sm">Essex Church Management</p>
        </div>
        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
          <LoginFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}


