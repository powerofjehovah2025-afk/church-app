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
        
        {/* Staff Login Only */}
        <div>
          <Link 
            href="/auth/login" 
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
