import { useGetLeaderboard } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [type, setType] = useState<'earnings' | 'tasks' | 'referrals' | 'streak'>('earnings');
  
  const { data: leaderboard, isLoading } = useGetLeaderboard({ period, type });

  const formatValue = (val: number, currentType: string) => {
    switch(currentType) {
      case 'earnings': return formatCurrency(val);
      case 'streak': return `${val} days`;
      default: return formatNumber(val);
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 drop-shadow-md" />;
      case 2: return <Medal className="h-6 w-6 text-slate-400 drop-shadow-md" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600 drop-shadow-md" />;
      default: return <span className="font-bold text-slate-400">{rank}</span>;
    }
  };

  // Split into top 3 and the rest for the podium layout
  const top3 = leaderboard ? [...leaderboard].slice(0, 3) : [];
  const rest = leaderboard ? [...leaderboard].slice(3) : [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leaderboard</h1>
          <p className="text-slate-500 mt-1">See how you rank against other earners.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={type} onValueChange={(v: any) => setType(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-slate-100">
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="streak">Streaks</TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex justify-center items-end gap-4 h-64 mb-12">
                <Skeleton className="w-32 h-40 rounded-t-xl" />
                <Skeleton className="w-40 h-56 rounded-t-xl" />
                <Skeleton className="w-32 h-32 rounded-t-xl" />
              </div>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <>
              {/* Podium for top 3 */}
              {top3.length > 0 && (
                <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-6 mb-12 mt-12 pt-8">
                  {/* Rank 2 (Left) */}
                  {top3[1] && (
                    <div className="flex flex-col items-center w-28 sm:w-36 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                      <div className="mb-3 flex flex-col items-center">
                        <div className="relative mb-2">
                          <Avatar className={cn("h-14 w-14 border-4 border-slate-200", top3[1].isCurrentUser && "ring-2 ring-blue-500 ring-offset-2")}>
                            <AvatarImage src={top3[1].avatarUrl || ""} />
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-lg font-bold">{top3[1].username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-3 -right-2 bg-slate-200 rounded-full p-1 border-2 border-white">
                            <Medal className="h-4 w-4 text-slate-500" />
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 text-sm truncate w-full text-center">{top3[1].username}</span>
                        <span className="text-xs text-slate-500">Lvl {top3[1].level}</span>
                      </div>
                      <div className="w-full bg-gradient-to-b from-slate-200 to-slate-100 rounded-t-lg h-32 flex flex-col items-center justify-start pt-4 border border-b-0 border-slate-300">
                        <span className="font-black text-slate-700 text-lg">{formatValue(top3[1].value, type)}</span>
                      </div>
                    </div>
                  )}

                  {/* Rank 1 (Center) */}
                  {top3[0] && (
                    <div className="flex flex-col items-center w-32 sm:w-44 z-10 animate-in slide-in-from-bottom-12 duration-700">
                      <div className="mb-3 flex flex-col items-center">
                        <div className="relative mb-2">
                          <Avatar className={cn("h-20 w-20 border-4 border-yellow-200", top3[0].isCurrentUser && "ring-2 ring-blue-500 ring-offset-2")}>
                            <AvatarImage src={top3[0].avatarUrl || ""} />
                            <AvatarFallback className="bg-yellow-100 text-yellow-700 text-2xl font-bold">{top3[0].username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Crown className="h-8 w-8 text-yellow-500 drop-shadow-md" />
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 text-base truncate w-full text-center">{top3[0].username}</span>
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full mt-1">Lvl {top3[0].level}</span>
                      </div>
                      <div className="w-full bg-gradient-to-b from-yellow-200 to-yellow-100 rounded-t-lg h-44 flex flex-col items-center justify-start pt-6 border border-b-0 border-yellow-300 shadow-lg shadow-yellow-200/50">
                        <span className="font-black text-yellow-900 text-xl">{formatValue(top3[0].value, type)}</span>
                      </div>
                    </div>
                  )}

                  {/* Rank 3 (Right) */}
                  {top3[2] && (
                    <div className="flex flex-col items-center w-28 sm:w-36 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                      <div className="mb-3 flex flex-col items-center">
                        <div className="relative mb-2">
                          <Avatar className={cn("h-14 w-14 border-4 border-amber-200/50", top3[2].isCurrentUser && "ring-2 ring-blue-500 ring-offset-2")}>
                            <AvatarImage src={top3[2].avatarUrl || ""} />
                            <AvatarFallback className="bg-amber-50 text-amber-700 text-lg font-bold">{top3[2].username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-3 -left-2 bg-amber-100 rounded-full p-1 border-2 border-white">
                            <Medal className="h-4 w-4 text-amber-600" />
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 text-sm truncate w-full text-center">{top3[2].username}</span>
                        <span className="text-xs text-slate-500">Lvl {top3[2].level}</span>
                      </div>
                      <div className="w-full bg-gradient-to-b from-amber-100 to-amber-50/80 rounded-t-lg h-24 flex flex-col items-center justify-start pt-3 border border-b-0 border-amber-200">
                        <span className="font-black text-amber-800 text-base">{formatValue(top3[2].value, type)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rest of the list */}
              <div className="space-y-2">
                {rest.map((entry) => (
                  <Card key={entry.userId} className={cn(
                    "shadow-sm transition-colors border-0 ring-1",
                    entry.isCurrentUser ? "bg-blue-50/50 ring-blue-200" : "bg-white ring-slate-100 hover:bg-slate-50"
                  )}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-slate-400">
                        {entry.rank}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatarUrl || ""} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 truncate">{entry.username}</p>
                          {entry.isCurrentUser && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">You</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">Level {entry.level}</p>
                      </div>
                      <div className="text-right font-bold text-lg text-slate-900">
                        {formatValue(entry.value, type)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
              <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No data available</h3>
              <p className="text-slate-500">No rankings available for this period yet.</p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
