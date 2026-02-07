import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { RCCGLogo } from "@/components/rccg-logo";

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RCCGLogo size={80} showText={true} />
          </div>
          <p className="text-muted-foreground text-sm">Church Management System</p>
        </div>
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          <LoginFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}
