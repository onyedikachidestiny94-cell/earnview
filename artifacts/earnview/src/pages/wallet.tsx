import { useGetWallet, useGetTransactions, useGetWithdrawals, useCreateWithdrawal } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, Clock, Plus, Wallet as WalletIcon, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(5, "Minimum withdrawal is $5").max(1000, "Maximum per request is $1000"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  paymentDetails: z.string().min(5, "Please provide valid payment details (email, wallet address, etc)")
});

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { data: wallet, isLoading: walletLoading } = useGetWallet();
  const { data: transactions, isLoading: txLoading } = useGetTransactions({ limit: 50 });
  const { data: withdrawals, isLoading: withdrawalsLoading } = useGetWithdrawals();
  const createWithdrawalMutation = useCreateWithdrawal();

  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 10,
      paymentMethod: "",
      paymentDetails: "",
    },
  });

  const onSubmit = (data: z.infer<typeof withdrawalSchema>) => {
    if (!wallet) return;
    
    if (data.amount > wallet.balance) {
      form.setError("amount", { message: "Insufficient balance" });
      return;
    }

    createWithdrawalMutation.mutate({ data }, {
      onSuccess: () => {
        setWithdrawOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
        queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        toast.success("Withdrawal Requested", {
          description: "Your request is pending admin approval."
        });
      },
      onError: (err: any) => {
        toast.error(err.body?.error || "Failed to create withdrawal request");
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Wallet</h1>
        <p className="text-slate-500 mt-1">Manage your earnings and request payouts.</p>
      </div>

      {walletLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : wallet ? (
        <Card className="bg-slate-900 text-white border-slate-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <WalletIcon className="h-32 w-32" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-400 font-medium mb-1">Available Balance</p>
              <h2 className="text-5xl font-bold mb-4">{formatCurrency(wallet.balance)}</h2>
              <div className="flex gap-6 text-sm text-slate-300 justify-center md:justify-start">
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-0.5">Total Earned</span>
                  <span className="font-medium text-white">{formatCurrency(wallet.totalEarned)}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-0.5">Pending</span>
                  <span className="font-medium text-white">{formatCurrency(wallet.pendingWithdrawals)}</span>
                </div>
              </div>
            </div>
            
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 min-w-[200px] h-14 text-base font-bold shadow-lg shadow-black/20">
                  Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Withdrawal</DialogTitle>
                  <DialogDescription>
                    Funds will be processed within 1-2 business days. Minimum withdrawal is {formatCurrency(wallet.minimumWithdrawal)}.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500 font-medium">$</span>
                              <Input type="number" step="0.01" className="pl-7" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-slate-500 text-right mt-1">Available: {formatCurrency(wallet.balance)}</p>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payout Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                              <SelectItem value="crypto_usdc">Crypto (USDC ERC-20)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Details</FormLabel>
                          <FormControl>
                            <Input placeholder="Email, account number, or wallet address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-4">
                      <Button type="submit" className="w-full" disabled={createWithdrawalMutation.isPending || wallet.balance < wallet.minimumWithdrawal}>
                        {createWithdrawalMutation.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="pt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {txLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.amount > 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{tx.description}</p>
                          <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                            <span>{format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase tracking-wider">{tx.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Bal: {formatCurrency(tx.balanceAfter)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <WalletIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No transactions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdrawals" className="pt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {withdrawalsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : withdrawals && withdrawals.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {withdrawals.map(req => (
                    <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg text-slate-900">{formatCurrency(req.amount)}</span>
                          {req.status === 'pending' && <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                          {req.status === 'approved' && <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>}
                          {req.status === 'rejected' && <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>}
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-medium text-slate-900">{req.paymentMethod}</span> — {req.paymentDetails}
                        </p>
                        <p className="text-xs text-slate-400">Requested {format(new Date(req.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                      {req.adminNote && (
                        <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-700 max-w-sm border border-slate-200">
                          <span className="font-semibold block mb-1">Note from Admin:</span>
                          {req.adminNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <WalletIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No withdrawal requests yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
