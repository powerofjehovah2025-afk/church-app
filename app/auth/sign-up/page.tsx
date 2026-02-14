import { Suspense } from "react";
import { SignUpForm } from "@/components/sign-up-form";
import { RCCGLogo } from "@/components/rccg-logo";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RCCGLogo size={80} showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
            RCCG Power of Jehovah
          </h1>
          <p className="text-slate-400 text-sm">Essex Church Management</p>
        </div>
        <Suspense fallback={<div className="h-64 bg-slate-900/40 rounded-lg animate-pulse" />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
