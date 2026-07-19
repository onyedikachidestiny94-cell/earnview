import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Users, CheckSquare, Wallet, ArrowRight, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Overview</h1>
        <p className="text-slate-500 mt-1">Platform metrics and pending actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">
              +{stats.newUsersToday} today
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Active Users</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.activeUsers)}</div>
            <p className="text-xs text-slate-500 mt-1">
              Recently logged in
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Tasks Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalTasksCompleted)}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">
              +{stats.tasksCompletedToday} today
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRewardsDistributed)}</div>
            <p className="text-xs text-slate-500 mt-1">
              Distributed to users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-500" />
              Action Required: Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Pending Requests</p>
                <div className="text-4xl font-bold text-slate-900">{stats.pendingWithdrawalsCount}</div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Total Amount</p>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingWithdrawalsAmount)}</div>
              </div>
            </div>
            <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800">
              <Link href="/admin/withdrawals">Review Requests <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Quick Links</h3>
          <div className="grid gap-3">
            <Link href="/admin/users" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-colors shadow-sm group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div className="font-medium text-slate-900">Manage Users</div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </Link>
            <Link href="/admin/tasks" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-colors shadow-sm group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="font-medium text-slate-900">Manage Tasks</div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
