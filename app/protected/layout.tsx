import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center max-w-[100vw] overflow-x-hidden">
      <div className="flex-1 w-full flex flex-col gap-12 sm:gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14 sm:h-16">
          <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 p-3 px-4 sm:px-5 text-sm">
            <div className="flex flex-wrap gap-3 sm:gap-5 items-center font-semibold">
              <Link href={"/"} className="min-h-[44px] flex items-center">
                Next.js Supabase Starter
              </Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            <div className="flex items-center min-h-[44px]">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-12 sm:gap-20 max-w-5xl w-full px-4 sm:px-5 py-5">
          {children}
        </div>

        <footer className="w-full flex flex-col sm:flex-row items-center justify-center border-t gap-4 sm:gap-8 py-8 sm:py-16 text-center text-xs">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
