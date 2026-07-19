import { useGetAdminWithdrawals, useUpdateAdminWithdrawal } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle, Wallet, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const { data: withdrawals, isLoading } = useGetAdminWithdrawals({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const updateMutation = useUpdateAdminWithdrawal();

  const [activeReqId, setActiveReqId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);

  const openActionDialog = (id: number, type: 'approved' | 'rejected') => {
    setActiveReqId(id);
    setActionType(type);
    setNote("");
    setDialogOpen(true);
  };

  const handleAction = () => {
    if (!activeReqId || !actionType) return;

    updateMutation.mutate({
      withdrawalId: activeReqId,
      data: {
        status: actionType,
        adminNote: note || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
        toast.success(`Withdrawal ${actionType} successfully`);
        setDialogOpen(false);
      },
      onError: (err: any) => {
        toast.error(err.body?.error || "Failed to update withdrawal");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Withdrawal Requests</h1>
        <p className="text-slate-500 mt-1">Review and process user payouts.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Requests</CardTitle>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Requests</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : withdrawals && withdrawals.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {withdrawals.map((req) => (
                <div key={req.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-xl text-slate-900">{formatCurrency(req.amount)}</span>
                      {req.status === 'pending' && <Badge variant="secondary" className="bg-orange-100 text-orange-800"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                      {req.status === 'approved' && <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>}
                      {req.status === 'rejected' && <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>}
                      <span className="text-sm text-slate-500 ml-auto lg:ml-4">{format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-lg p-3 inline-block shadow-sm">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">User: <span className="font-bold text-slate-900 normal-case">{req.username}</span> (ID: {req.userId})</p>
                      <p className="text-sm">
                        <span className="font-semibold text-slate-700">{req.paymentMethod}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="font-mono text-slate-600">{req.paymentDetails}</span>
                      </p>
                    </div>
                    
                    {req.adminNote && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-slate-600 bg-slate-100 p-2 rounded">
                        <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Note:</span> {req.adminNote}</span>
                      </div>
                    )}
                  </div>
                  
                  {req.status === 'pending' && (
                    <div className="flex gap-2 lg:flex-col lg:shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => openActionDialog(req.id, 'approved')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50" 
                        onClick={() => openActionDialog(req.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-900">No requests found</p>
              <p>There are no {statusFilter !== 'all' ? statusFilter : ''} withdrawal requests.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approved' 
                ? 'Confirming will deduct funds from the platform and mark the request as paid.' 
                : 'Rejecting will return the funds to the user\'s balance.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Admin Note (Optional)</Label>
              <Textarea 
                id="note" 
                placeholder={actionType === 'rejected' ? "Reason for rejection..." : "Transaction ID or confirmation..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAction} 
              className={`w-full ${actionType === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Processing..." : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
