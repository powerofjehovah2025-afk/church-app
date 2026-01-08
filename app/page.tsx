import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          RCCG Power of Jehovah
        </h1>
        <p className="text-slate-400 text-lg mb-12">
          Church Management System
        </p>
        
        {/* Public Forms Section */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-slate-300 mb-4">Visitor Forms</h2>
          <Link 
            href="/welcome" 
            className="block px-6 py-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Welcome Form
          </Link>
          <Link 
            href="/membership" 
            className="block px-6 py-4 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg text-white font-medium transition-colors shadow-lg shadow-green-500/20"
          >
            Membership Form
          </Link>
        </div>

        {/* Staff Login Section */}
        <div className="border-t border-slate-700/50 pt-8">
          <h2 className="text-xl font-semibold text-slate-300 mb-4">Staff Access</h2>
          <Link 
            href="/auth/login" 
            className="block px-6 py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white font-medium transition-colors"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
