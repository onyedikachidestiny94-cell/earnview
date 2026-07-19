import { useGetNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckSquare, Trophy, Wallet, BellRing, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate({}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      }
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckSquare className="h-5 w-5 text-blue-600" />;
      case 'achievement':
        return <Trophy className="h-5 w-5 text-purple-600" />;
      case 'withdrawal_approved':
      case 'withdrawal_rejected':
        return <Wallet className="h-5 w-5 text-orange-600" />;
      default:
        return <BellRing className="h-5 w-5 text-slate-600" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'task_completed': return "bg-blue-100";
      case 'achievement': return "bg-purple-100";
      case 'withdrawal_approved':
      case 'withdrawal_rejected': return "bg-orange-100";
      default: return "bg-slate-100";
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Updates on your tasks, rewards, and withdrawals.</p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            className="shrink-0 gap-2 bg-white"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={cn(
                "overflow-hidden transition-all duration-200 border-0 shadow-sm",
                !notif.isRead ? "ring-1 ring-blue-200 bg-blue-50/30" : "ring-1 ring-slate-200 bg-white"
              )}
            >
              <CardContent className="p-0 flex">
                <div className={cn("w-1.5 shrink-0", !notif.isRead ? "bg-blue-500" : "bg-transparent")} />
                <div className="p-5 flex-1 flex gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    getBgForType(notif.type)
                  )}>
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h4 className={cn(
                        "text-base truncate",
                        !notif.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                      )}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      !notif.isRead ? "text-slate-700" : "text-slate-500"
                    )}>
                      {notif.message}
                    </p>
                    
                    {!notif.isRead && (
                      <div className="mt-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 -ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          onClick={() => handleMarkRead(notif.id)}
                        >
                          Mark as read
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">You're all caught up</h3>
          <p className="text-slate-500">No notifications to show right now.</p>
        </div>
      )}
    </div>
  );
}
