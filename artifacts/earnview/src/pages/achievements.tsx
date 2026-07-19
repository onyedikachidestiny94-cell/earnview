import { useGetAchievements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Shield, Zap, Target, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Map icon strings to components
const getIcon = (iconName: string, earned: boolean, className: string) => {
  const props = { className: cn(className, earned ? "" : "opacity-40 grayscale") };
  switch (iconName) {
    case "star": return <Star {...props} />;
    case "shield": return <Shield {...props} />;
    case "zap": return <Zap {...props} />;
    case "target": return <Target {...props} />;
    default: return <Trophy {...props} />;
  }
};

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useGetAchievements();

  const earnedCount = achievements?.filter(a => a.earned).length || 0;
  const totalCount = achievements?.length || 1;
  const completionPercent = Math.round((earnedCount / totalCount) * 100) || 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Achievements</h1>
          <p className="text-slate-500 mt-1">Unlock badges and earn XP by completing milestones.</p>
        </div>
        
        <Card className="shadow-sm border-slate-200 bg-slate-900 text-white min-w-[240px]">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">Completion</span>
              <span className="font-bold text-blue-400">{earnedCount} / {totalCount}</span>
            </div>
            <Progress value={completionPercent} className="h-2.5 bg-slate-800" indicatorClassName="bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-2 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {achievements.map((badge) => (
            <Card 
              key={badge.id} 
              className={cn(
                "shadow-sm transition-all duration-300 overflow-hidden relative",
                badge.earned 
                  ? "bg-white border-blue-100 hover:shadow-md hover:border-blue-200" 
                  : "bg-slate-50 border-slate-100 border-dashed"
              )}
            >
              {!badge.earned && (
                <div className="absolute top-3 right-3 text-slate-300">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center mb-4 transition-transform",
                  badge.earned ? "bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner scale-110" : "bg-slate-100"
                )}>
                  {getIcon(badge.icon, badge.earned, cn(
                    "h-10 w-10", 
                    badge.earned ? "text-blue-600 drop-shadow-sm" : "text-slate-400"
                  ))}
                </div>
                
                <h3 className={cn(
                  "font-bold text-lg mb-1 leading-tight",
                  badge.earned ? "text-slate-900" : "text-slate-600"
                )}>
                  {badge.badgeName}
                </h3>
                
                <p className="text-xs text-slate-500 mb-6 flex-1">
                  {badge.description}
                </p>
                
                <div className="w-full mt-auto space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={badge.earned ? "text-blue-600" : "text-slate-500"}>
                      {badge.progress} / {badge.requirementValue}
                    </span>
                    <span className="text-slate-400">+{badge.xpReward} XP</span>
                  </div>
                  <Progress 
                    value={(badge.progress / badge.requirementValue) * 100} 
                    className="h-2" 
                    indicatorClassName={badge.earned ? "bg-blue-500" : "bg-slate-300"}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
          <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No achievements available</h3>
          <p className="text-slate-500">Check back later for new challenges.</p>
        </div>
      )}
    </div>
  );
}
