"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  QrCode, 
  Menu, 
  LogOut,
  Users,
  Key,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  CheckSquare,
  Mail,
  AlertCircle,
  BarChart3,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { RCCGLogo, RCCGLogoIcon } from "@/components/rccg-logo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [mobileQrSheetOpen, setMobileQrSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Track when component has mounted on the client to prevent hydration mismatches
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navItems = [
    {
      name: "Ministry Growth Center",
      href: "/admin/newcomers",
      icon: LayoutDashboard,
    },
    {
      name: "Rota Management",
      href: "/admin/rota",
      icon: Calendar,
    },
    {
      name: "Task Assignment",
      href: "/admin/tasks",
      icon: CheckSquare,
    },
    {
      name: "Messaging",
      href: "/admin/messages",
      icon: Mail,
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Roles Management",
      href: "/admin/roles",
      icon: Shield,
    },
    {
      name: "Invitation Codes",
      href: "/admin/invitation-codes",
      icon: Key,
    },
    {
      name: "Form Builder",
      href: "/admin/forms",
      icon: FileText,
    },
    {
      name: "Follow-up Reminders",
      href: "/admin/reminders",
      icon: AlertCircle,
    },
    {
      name: "Follow-up Reports",
      href: "/admin/reports/followups",
      icon: BarChart3,
    },
    {
      name: "Announcements",
      href: "/admin/announcements",
      icon: Mail,
    },
    {
      name: "Prayer Requests",
      href: "/admin/prayer-requests",
      icon: Heart,
    },
    {
      name: "Events",
      href: "/admin/events",
      icon: Calendar,
    },
    {
      name: "Staff Directory",
      href: "/admin/staff",
      icon: Users,
    },
  ];

  // Return skeleton while mounting to prevent hydration mismatch
  if (!hasMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-col border-r border-rccg-navy/30 bg-rccg-navy/20 backdrop-blur-md transition-all duration-300`}>
        <div className={`flex h-16 items-center border-b border-rccg-navy/30 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {sidebarCollapsed ? (
            <RCCGLogoIcon size={32} />
          ) : (
            <RCCGLogo size={40} showText={true} className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`flex items-center justify-center h-9 w-9 rounded-md text-white hover:bg-rccg-maroon/50 border border-rccg-navy/50 bg-rccg-navy/30 transition-colors ${sidebarCollapsed ? '' : 'ml-auto'}`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-rccg-maroon text-white"
                    : "text-slate-300 hover:bg-rccg-navy/30 hover:text-white"
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* QR Code Generator Section */}
        <div className="border-t border-rccg-navy/30 p-4">
          {hasMounted && (
            <Sheet open={qrSheetOpen} onOpenChange={setQrSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full ${sidebarCollapsed ? 'px-0 justify-center' : 'justify-start'} bg-rccg-navy/30 border-rccg-navy/50 hover:bg-rccg-maroon/50 text-white`}
                  title={sidebarCollapsed ? "QR Code Generator" : undefined}
                >
                  <QrCode className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                  {!sidebarCollapsed && "QR Code Generator"}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full sm:max-w-4xl bg-rccg-navy/95 backdrop-blur-md border-rccg-navy/50 overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle className="text-white">Form QR Codes</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-row flex-wrap gap-4 pb-6 justify-center items-start">
            <QRCodeDisplay 
              url={`${baseUrl}/welcome`}
              title="Welcome Form"
              size={180}
            />
            <QRCodeDisplay 
              url={`${baseUrl}/membership`}
              title="Membership Form"
              size={180}
            />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Logout Button */}
        <div className="border-t border-rccg-navy/30 p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className={`w-full ${sidebarCollapsed ? 'px-0 justify-center' : 'justify-start'} bg-rccg-navy/30 border-rccg-navy/50 hover:bg-rccg-maroon/50 text-white`}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-2'}`} />
            {!sidebarCollapsed && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {hasMounted && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent 
            side="left" 
            className="w-64 bg-rccg-navy/95 backdrop-blur-md border-rccg-navy/50 p-0"
          >
          <div className="flex h-16 items-center border-b border-rccg-navy/30 px-6">
            <RCCGLogo size={40} showText={true} />
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-rccg-maroon text-white"
                      : "text-slate-300 hover:bg-rccg-navy/30 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-rccg-navy/30 p-4 space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setSidebarOpen(false);
                setTimeout(() => setMobileQrSheetOpen(true), 300);
              }}
              className="w-full justify-start bg-rccg-navy/30 border-rccg-navy/50 hover:bg-rccg-maroon/50 text-white"
            >
              <QrCode className="h-5 w-5 mr-2" />
              QR Code Generator
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start bg-rccg-navy/30 border-rccg-navy/50 hover:bg-rccg-maroon/50 text-white"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </SheetContent>
        </Sheet>
      )}

      {/* Mobile QR Code Sheet */}
      {hasMounted && (
        <Sheet open={mobileQrSheetOpen} onOpenChange={setMobileQrSheetOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-4xl bg-rccg-navy/95 backdrop-blur-md border-rccg-navy/50 overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-white">Form QR Codes</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-row flex-wrap gap-4 pb-6 justify-center items-start">
            <QRCodeDisplay 
              url={`${baseUrl}/welcome`}
              title="Welcome Form"
              size={180}
            />
            <QRCodeDisplay 
              url={`${baseUrl}/membership`}
              title="Membership Form"
              size={180}
            />
          </div>
        </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex h-16 items-center border-b border-rccg-navy/30 px-4 bg-rccg-navy/20 backdrop-blur-md">
          {hasMounted && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-rccg-maroon/50"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </Sheet>
          )}
          <RCCGLogo size={36} showText={true} className="ml-2" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

