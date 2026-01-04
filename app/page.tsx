import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          RCCG Power of Jehovah
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Church Management System
        </p>
        <div className="mt-8 space-y-4">
          <Link 
            href="/welcome" 
            className="block px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50 transition-colors"
          >
            Welcome Form
          </Link>
          <Link 
            href="/auth/login" 
            className="block px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/dashboard" 
            className="block px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/newcomers" 
            className="block px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50 transition-colors"
          >
            Admin Dashboard
          </Link>
        </div>
        <p className="text-slate-500 text-sm mt-8">
          Routes are working! 🎉
        </p>
      </div>
    </div>
  );
}
