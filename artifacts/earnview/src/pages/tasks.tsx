import { useGetTasks } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Clock, PlayCircle, Filter, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksPage() {
  const [filter, setFilter] = useState<'available' | 'completed' | 'all'>('available');
  const { data: tasks, isLoading } = useGetTasks({ status: filter });

  const categories = Array.from(new Set(tasks?.map(t => t.category) || []));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Available Tasks</h1>
          <p className="text-slate-500 mt-1">Complete tasks to earn rewards and build your streak.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg shrink-0">
          <Button 
            variant={filter === 'available' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('available')}
            className={filter === 'available' ? 'shadow-sm' : ''}
          >
            Available
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'shadow-sm' : ''}
          >
            Completed
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent className="pb-2 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No tasks found</h3>
          <p className="text-slate-500">There are no {filter} tasks matching your criteria right now.</p>
          {filter !== 'available' && (
            <Button variant="outline" className="mt-6" onClick={() => setFilter('available')}>
              View Available Tasks
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <Card key={task.id} className={`shadow-sm flex flex-col transition-all hover:shadow-md ${task.completedByUser ? 'bg-slate-50 opacity-80' : 'bg-white'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-0">
                    {task.category}
                  </Badge>
                  {task.completedByUser && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl leading-tight line-clamp-2">{task.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex flex-col">
                <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                  {task.description}
                </p>
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Reward</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(task.rewardAmount)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-slate-600 text-sm font-medium mb-1">
                      <Clock className="h-4 w-4" />
                      {Math.ceil(task.durationSeconds / 60)} min
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                      +{task.xpReward} XP
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                {task.completedByUser ? (
                  <Button variant="outline" className="w-full border-slate-200 text-slate-500" disabled>
                    Already Completed
                  </Button>
                ) : (
                  <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    <Link href={`/tasks/${task.id}`}>
                      {task.videoUrl ? <PlayCircle className="mr-2 h-4 w-4" /> : null}
                      Start Task
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
