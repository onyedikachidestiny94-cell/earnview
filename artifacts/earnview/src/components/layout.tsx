import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useDailyCheckin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Users,
  Award,
  Trophy,
  Bell,
  Settings,
  LogOut,
  Shield,
  Menu,
  CheckCircle2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user, isLoading } = useGetMe({ query: { enabled: !!clerkUser } });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const checkinMutation = useDailyCheckin();

  const handleCheckin = () => {
    checkinMutation.mutate({}, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success("Daily Check-in Successful!", {
            description: `You're on a ${data.streakCount}-day streak. Bonus: ${formatCurrency(data.bonusAmount)} and ${data.xpBonus} XP.`
          });
        }
      },
      onError: (err: any) => {
        if (err.status === 400 && err.body?.error?.includes("already")) {
          toast("Already checked in today.", {
            description: "Come back tomorrow to keep your streak going!"
          });
        } else {
          toast.error("Failed to check in.");
        }
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/referrals", label: "Referrals", icon: Users },
    { href: "/achievements", label: "Achievements", icon: Award },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="text-blue-600" />
          <span className="font-bold text-lg text-slate-900">EarnView</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:w-64 md:shrink-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-2">
          <Logo className="text-blue-600 h-8 w-8" />
          <span className="font-bold text-xl text-slate-900 tracking-tight">EarnView</span>
        </div>

        <div className="px-6 py-4 md:py-0 pb-6 border-b border-slate-100 mb-4">
          {isLoading || !user ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-slate-900">{user.username}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">Level {user.level}</Badge>
                <span className="text-xs text-slate-500">{formatCurrency(user.balance)}</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.startsWith(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4 bg-slate-900 text-white hover:bg-slate-800"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield className="h-5 w-5 shrink-0 text-blue-400" />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 mb-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            onClick={handleCheckin}
            disabled={checkinMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Daily Check-in
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
