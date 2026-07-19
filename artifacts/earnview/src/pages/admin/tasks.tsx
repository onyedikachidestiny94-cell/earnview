import { useGetAdminTasks, useCreateAdminTask, useUpdateAdminTask, useDeleteAdminTask } from "@workspace/api-client-react";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CheckSquare, Plus, Edit2, Trash2, Video, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const taskSchema = z.object({
  title: z.string().min(5, "Title is required"),
  description: z.string().min(10, "Description is required"),
  category: z.string().min(1, "Category is required"),
  rewardAmount: z.coerce.number().min(0.01, "Must be greater than 0"),
  xpReward: z.coerce.number().min(1, "Must be greater than 0"),
  durationSeconds: z.coerce.number().min(10, "Minimum 10 seconds"),
  videoUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});

export default function AdminTasks() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useGetAdminTasks();
  
  const createMutation = useCreateAdminTask();
  const updateMutation = useUpdateAdminTask();
  const deleteMutation = useDeleteAdminTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Surveys",
      rewardAmount: 1.00,
      xpReward: 50,
      durationSeconds: 60,
      videoUrl: "",
      isActive: true
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({
      title: "",
      description: "",
      category: "Surveys",
      rewardAmount: 1.00,
      xpReward: 50,
      durationSeconds: 60,
      videoUrl: "",
      isActive: true
    });
    setDialogOpen(true);
  };

  const openEdit = (task: any) => {
    setEditingId(task.id);
    form.reset({
      title: task.title,
      description: task.description,
      category: task.category,
      rewardAmount: task.rewardAmount,
      xpReward: task.xpReward,
      durationSeconds: task.durationSeconds,
      videoUrl: task.videoUrl || "",
      isActive: task.isActive
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    if (editingId) {
      updateMutation.mutate({ taskId: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
          toast.success("Task updated");
          setDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.body?.error || "Failed to update task")
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
          toast.success("Task created");
          setDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.body?.error || "Failed to create task")
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate({ taskId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
          toast.success("Task deleted");
        },
        onError: (err: any) => toast.error(err.body?.error || "Failed to delete task")
      });
    }
  };

  const toggleStatus = (task: any) => {
    const mutateFn = updateMutation.mutate;
    mutateFn({ 
      taskId: task.id, 
      data: { ...task, isActive: !task.isActive } 
    }, {
      onSuccess: () => {
        // Optimistic UI update via cache is better, but this works for now
        queryClient.setQueryData(["/api/admin/tasks"], (old: any) => {
          if (!old) return old;
          return old.map((t: any) => t.id === task.id ? { ...t, isActive: !t.isActive } : t);
        });
        toast.success(`Task ${!task.isActive ? 'activated' : 'deactivated'}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Task Management</h1>
          <p className="text-slate-500 mt-1">Create and manage earning opportunities.</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-slate-900 text-white hover:bg-slate-800 shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Video">Video</SelectItem>
                            <SelectItem value="Surveys">Surveys</SelectItem>
                            <SelectItem value="App Testing">App Testing</SelectItem>
                            <SelectItem value="Signup">Signup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Seconds)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rewardAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward ($)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="xpReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>XP Reward</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://youtube.com/..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">Make task available immediately</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? 'Save Changes' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between pt-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : tasks && tasks.length > 0 ? (
          tasks.map(task => (
            <Card key={task.id} className={`shadow-sm overflow-hidden flex flex-col ${!task.isActive ? 'opacity-70 grayscale-[0.3]' : ''}`}>
              <div className={`h-2 w-full ${task.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="bg-slate-50">{task.category}</Badge>
                  {task.videoUrl && <Video className="h-4 w-4 text-slate-400" />}
                </div>
                <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex flex-col">
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{task.description}</p>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Reward</span>
                    <span className="font-bold text-green-600">{formatCurrency(task.rewardAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">XP</span>
                    <span className="font-bold text-blue-600">+{task.xpReward}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{task.durationSeconds}s duration</span>
                  <span>{formatNumber(task.completionCount)} completions</span>
                </div>
              </CardContent>
              <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={task.isActive ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"}
                  onClick={() => toggleStatus(task)}
                >
                  {task.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(task)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-xl">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">No tasks created</h3>
            <p className="text-slate-500 mb-4">Create your first task to start engaging users.</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2"/> Create Task</Button>
          </div>
        )}
      </div>
    </div>
  );
}
