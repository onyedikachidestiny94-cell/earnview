import { useGetAdminUsers, useUpdateAdminUser } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { Search, Shield, Ban, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  
  // Debounce search in a real app, but for now just pass it directly
  const { data: users, isLoading } = useGetAdminUsers({ search: search || undefined, status: status !== 'all' ? status : undefined });
  const updateMutation = useUpdateAdminUser();

  const handleToggleSuspend = (userId: number, currentSuspended: boolean) => {
    updateMutation.mutate({ 
      userId, 
      data: { isSuspended: !currentSuspended } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        toast.success(`User ${!currentSuspended ? 'suspended' : 'unsuspended'} successfully`);
      },
      onError: (err: any) => {
        toast.error(err.body?.error || "Failed to update user");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">View and manage user accounts.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">All Users</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search email or username..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="w-full sm:w-[140px] bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Level</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || ""} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1">
                              {user.username}
                              {user.isAdmin && <Shield className="h-3 w-3 text-purple-500" />}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isSuspended ? (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Suspended</Badge>
                        ) : (
                          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(user.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.level}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={user.isSuspended ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                          onClick={() => handleToggleSuspend(user.id, user.isSuspended)}
                          disabled={user.isAdmin || updateMutation.isPending}
                        >
                          {user.isSuspended ? (
                            <><CheckCircle2 className="h-4 w-4 mr-1" /> Unsuspend</>
                          ) : (
                            <><Ban className="h-4 w-4 mr-1" /> Suspend</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-900">No users found</p>
              <p>Try adjusting your search filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
