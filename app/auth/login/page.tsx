import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { RCCGLogo } from "@/components/rccg-logo";

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-md px-1 sm:px-0">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <RCCGLogo size={80} showText={false} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
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
