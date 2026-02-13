import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          RCCG Power of Jehovah
        </h1>
        <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-12">
          Church Management System
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center min-h-[48px] px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Staff Login
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center min-h-[48px] px-6 sm:px-8 py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-slate-600 rounded-lg text-white font-medium transition-colors"
          >
            Sign up
          </Link>
        </div>
        <p className="mt-6 text-slate-500 text-sm">
          New here?{" "}
          <Link href="/welcome" className="text-slate-300 hover:text-white underline underline-offset-2">
            Welcome
          </Link>
          {" · "}
          <Link href="/membership" className="text-slate-300 hover:text-white underline underline-offset-2">
            Membership
          </Link>
        </p>
      </div>
    </div>
  );
}
