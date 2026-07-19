import { useGetReferrals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, Link2, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ReferralsPage() {
  const { data: stats, isLoading } = useGetReferrals();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!stats) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join EarnView',
        text: 'Sign up for EarnView using my referral link and start earning rewards!',
        url: stats.referralLink,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refer & Earn</h1>
        <p className="text-slate-500 mt-1">Invite friends and earn a bonus when they sign up and complete their first task.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-blue-200 shadow-md relative overflow-hidden bg-gradient-to-br from-white to-blue-50">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Users className="h-40 w-40 text-blue-600" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">Your Referral Link</CardTitle>
              <CardDescription className="text-blue-700/80">Share this link. When someone joins and completes a task, you both earn a bonus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-white border border-blue-200 rounded-lg p-3 flex items-center shadow-inner text-sm font-mono text-slate-600 overflow-x-auto whitespace-nowrap">
                  {stats.referralLink}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant={copied ? "success" : "default"} className="min-w-[100px]">
                    {copied ? <><Check className="h-4 w-4 mr-2" /> Copied</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="bg-white">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                Code: <span className="ml-2 font-bold tracking-wider">{stats.referralCode}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Invited</p>
                <div className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                  {stats.totalReferrals}
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-green-100 bg-green-50/30">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Earned</p>
                <div className="text-4xl font-bold text-green-600">
                  {formatCurrency(stats.totalEarned)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg">Your Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : stats && stats.referrals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.referrals.map(ref => (
                <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {ref.referredUsername.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{ref.referredUsername}</p>
                      <p className="text-xs text-slate-500">Joined {format(new Date(ref.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{formatCurrency(ref.rewardAmount)}</p>
                    <p className="text-xs text-slate-400">Bonus received</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Link2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-900 mb-1">No referrals yet</p>
              <p className="text-sm">Share your link to start earning bonuses.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
