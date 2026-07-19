import { useGetDashboard, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Flame, TrendingUp, Trophy, ArrowRight, Activity, Bell } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboard();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Here is your earning overview and recent activity.</p>
        </div>
        <Button asChild className="shrink-0 gap-2 shadow-sm">
          <Link href="/tasks">Browse Tasks <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <WalletIcon className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(stats.balance)}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Total earned: {formatCurrency(stats.totalEarned)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Tasks Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.tasksCompleted)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.tasksAvailable} available right now
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Active Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.streakCount} Days</div>
            <p className="text-xs text-slate-500 mt-1">
              Check in daily for bonuses
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Level {stats.level}</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold mb-2 truncate">{stats.levelName}</div>
            <Progress value={stats.xpProgress} className="h-2 bg-slate-800" indicatorClassName="bg-blue-500" />
            <p className="text-xs text-slate-400 mt-2 text-right">
              {stats.xpToNextLevel} XP to Next
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions / Alerts */}
          {(stats.pendingWithdrawals > 0 || stats.unreadNotifications > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {stats.pendingWithdrawals > 0 && (
                <Card className="bg-amber-50 border-orange-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                        <Activity className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">Withdrawal Pending</p>
                        <p className="text-xs text-amber-700">{stats.pendingWithdrawals} request(s) under review</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-white border-orange-200 text-amber-900 hover:bg-orange-100">
                      <Link href="/wallet">View</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {stats.unreadNotifications > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center relative">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Unread Notifications</p>
                        <p className="text-xs text-blue-700">{stats.unreadNotifications} new alert(s)</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-white border-blue-200 text-blue-900 hover:bg-blue-100">
                      <Link href="/notifications">View</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activity.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === 'task_completed' ? 'bg-green-100 text-green-600' :
                          item.type === 'withdrawal' ? 'bg-orange-100 text-orange-600' :
                          item.type === 'achievement' ? 'bg-purple-100 text-purple-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {item.type === 'task_completed' ? <CheckSquare className="h-5 w-5" /> :
                           item.type === 'withdrawal' ? <WalletIcon className="h-5 w-5" /> :
                           item.type === 'achievement' ? <Trophy className="h-5 w-5" /> :
                           <Activity className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {item.amount != null && item.amount !== 0 && (
                        <div className={`font-semibold text-sm ${item.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                          {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Activity className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No recent activity.</p>
                  <Button variant="link" asChild className="mt-2 text-blue-600">
                    <Link href="/tasks">Complete a task to get started</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Mini Referrals */}
          <Card className="shadow-sm border-blue-100 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Refer & Earn</CardTitle>
              <CardDescription>Invite friends, earn a bonus for each.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-blue-100 mb-4 text-center">
                <p className="text-sm text-slate-500 mb-1">Total Referral Earnings</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.referralEarnings)}</p>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link href="/referrals">Get Referral Link</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Simple internal icon since we're using a lot of standard ones from lucide
function WalletIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
