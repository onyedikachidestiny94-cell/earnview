import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { User, Settings, Shield, Award, Mail } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Max 20 characters"),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();
  const updateMutation = useUpdateMe();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      avatarUrl: "",
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, form]);

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        toast.success("Profile updated successfully");
      },
      onError: (err: any) => {
        toast.error(err.body?.error || "Failed to update profile");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Card>
          <CardContent className="p-6 flex gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile & Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-0 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Award className="h-24 w-24" />
            </div>
            <CardContent className="p-6 flex flex-col items-center text-center relative z-10">
              <Avatar className="h-24 w-24 border-4 border-slate-800 mb-4 shadow-xl">
                <AvatarImage src={user.avatarUrl || ""} />
                <AvatarFallback className="bg-slate-800 text-white text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold mb-1">{user.username}</h2>
              <div className="flex items-center gap-2 mb-6 text-slate-400 text-sm">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              
              <div className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Level {user.level}</span>
                  <Badge variant="secondary" className="bg-blue-900 text-blue-200 hover:bg-blue-900 border-0">{user.levelName}</Badge>
                </div>
                <p className="text-left text-xs text-slate-500">Total XP: {user.xp}</p>
              </div>
              
              {user.isAdmin && (
                <div className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/50 py-2 rounded-lg border border-purple-900">
                  <Shield className="h-4 w-4" /> Admin Account
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Member Since</span>
                <span className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Current Streak</span>
                <span className="font-medium text-slate-900">{user.streakCount} Days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-slate-400" />
                Public Profile
              </CardTitle>
              <CardDescription>Update how you appear to others on the leaderboard.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} className="max-w-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.jpg" {...field} className="max-w-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-400" />
                Preferences
              </CardTitle>
              <CardDescription>Manage your app experience.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-slate-900">Email Notifications</h4>
                  <p className="text-sm text-slate-500">Receive emails about new tasks and rewards.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-slate-900">Withdrawal Alerts</h4>
                  <p className="text-sm text-slate-500">Get notified when payouts are approved.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium text-slate-900">Public Leaderboard</h4>
                  <p className="text-sm text-slate-500">Show your profile on the global rankings.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
