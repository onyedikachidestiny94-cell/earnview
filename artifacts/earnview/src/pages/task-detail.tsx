import { useGetTask, useCompleteTask } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Clock, ShieldCheck, Trophy, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import ReactPlayer from "react-player";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: task, isLoading: taskLoading } = useGetTask(taskId, { query: { enabled: !!taskId } });
  const completeMutation = useCompleteTask();
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [playing, setPlaying] = useState(false);

  const watchedRef = useRef<number>(0);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (task && !task.completedByUser && timeLeft === null && !completed) {
      setTimeLeft(task.durationSeconds);
    }
  }, [task, timeLeft, completed]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive && timeLeft !== null && timeLeft > 0) {
      timer = setTimeout(() => {
        // keep countdown in sync with watchedRef if possible
        const watched = Math.floor(watchedRef.current);
        const remaining = Math.max(0, task.durationSeconds - watched);
        setTimeLeft(remaining);
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, timeLeft, task]);

  const handleStart = () => {
    setIsActive(true);
    setPlaying(true);
  };

  const handleClaim = () => {
    if (!task) return;
    const watchedDuration = Math.floor(watchedRef.current);
    completeMutation.mutate({
      taskId: task.id,
      data: { watchedDuration }
    }, {
      onSuccess: (data) => {
        setCompleted(true);
        setRewardData(data);
        setPlaying(false);
        setIsActive(false);
        // Invalidate queries to refresh dashboard and wallet
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        
        toast.success("Reward Claimed!", {
          description: `You earned ${formatCurrency(data.rewardAmount)} and ${data.xpEarned} XP.`
        });
      },
      onError: (err: any) => {
        toast.error(err.body?.error || "Failed to claim reward");
      }
    });
  };

  if (taskLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-6 w-24 mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 md:p-8 text-center max-w-xl mx-auto mt-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Task not found</h2>
        <p className="text-slate-500 mb-6">The task you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/tasks">Return to Tasks</Link>
        </Button>
      </div>
    );
  }

  if (completed && rewardData) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto min-h-[80vh] flex flex-col justify-center">
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <Trophy className="h-12 w-12 text-green-600 z-10" />
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Task Completed!</h2>
          <p className="text-slate-500 mb-8">Great job! The rewards have been added to your wallet.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-10 max-w-md mx-auto">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Earned</p>
              <p className="text-2xl font-bold text-green-600">+{formatCurrency(rewardData.rewardAmount)}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">XP Gained</p>
              <p className="text-2xl font-bold text-blue-600">+{rewardData.xpEarned}</p>
            </div>
          </div>
          
          {rewardData.leveledUp && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 flex items-center justify-center gap-3">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <div className="text-left">
                <p className="font-bold">Level Up!</p>
                <p className="text-sm">You are now Level {rewardData.newLevel}: {rewardData.newLevelName}</p>
              </div>
            </div>
          )}
          
          <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8">
            <Link href="/tasks">Find Another Task</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCompleted = task.completedByUser;
  const minDuration = Math.floor(task.durationSeconds * 0.8);
  const watched = Math.floor(watchedRef.current);
  const progressPercent = task.durationSeconds > 0 ? ((watched / task.durationSeconds) * 100) : 0;
  const canClaim = watched >= minDuration || timeLeft === 0;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-blue-600 mb-2">
        <Link href="/tasks">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to tasks
        </Link>
      </Button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Card className="overflow-hidden border-0 shadow-md">
            {task.videoUrl ? (
              <div className="aspect-video bg-slate-900 w-full relative">
                <ReactPlayer
                  ref={playerRef}
                  url={task.videoUrl}
                  playing={playing}
                  controls={true}
                  width="100%"
                  height="100%"
                  onProgress={(state) => {
                    // state.playedSeconds is a float
                    watchedRef.current = state.playedSeconds;
                    const remaining = Math.max(0, task.durationSeconds - Math.floor(state.playedSeconds));
                    setTimeLeft(remaining);
                  }}
                  onEnded={() => {
                    watchedRef.current = task.durationSeconds;
                    setTimeLeft(0);
                    setPlaying(false);
                    setIsActive(false);
                  }}
                />

                {isActive && (
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-mono flex items-center gap-2">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                    Watching...
                  </div>
                )}

                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white/40 text-center pointer-events-auto">
                      <p className="text-lg font-medium mb-2">Sponsor Content</p>
                      <p className="text-sm">Video ID: {String(task.videoUrl).split('v=')[1] || 'demo'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[21/9] bg-gradient-to-br from-blue-50 to-indigo-50 w-full flex items-center justify-center border-b border-slate-100">
                <ShieldCheck className="h-16 w-16 text-blue-200" />
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline">{task.category}</Badge>
                {isCompleted && <Badge variant="success">Completed</Badge>}
              </div>
              <CardTitle className="text-2xl leading-tight">{task.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 leading-relaxed">{task.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <Card className="shadow-md sticky top-24">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg">Task Reward</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Earnings</p>
                  <p className="text-4xl font-bold text-green-600">{formatCurrency(task.rewardAmount)}</p>
                </div>
                <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 mb-1 uppercase">XP Bonus</p>
                    <p className="text-lg font-bold text-blue-600">+{task.xpReward}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="flex-1 text-right">
                    <p className="text-xs font-medium text-slate-500 mb-1 uppercase">Duration</p>
                    <p className="text-lg font-bold text-slate-900 flex items-center justify-end gap-1">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {task.durationSeconds}s
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex-col gap-4 p-6 bg-slate-50 border-t border-slate-100">
              {isCompleted ? (
                <Button className="w-full" variant="secondary" disabled>
                  Reward Already Claimed
                </Button>
              ) : canClaim ? (
                <Button 
                  className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 animate-in pulse" 
                  onClick={handleClaim}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? "Claiming..." : "Claim Reward"}
                </Button>
              ) : isActive ? (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-500">In progress...</span>
                    <span className="text-slate-900 font-mono">{timeLeft}s remaining</span>
                  </div>
                  <Progress value={Math.min(100, progressPercent)} className="h-3" />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setPlaying(false); setIsActive(false); }}>Pause</Button>
                    <Button onClick={() => { setPlaying(true); setIsActive(true); }}>Resume</Button>
                  </div>
                </div>
              ) : (
                <Button 
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={handleStart}
                >
                  Start Task
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
