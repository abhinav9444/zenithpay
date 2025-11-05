'use client';

import type { Transaction, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight, ArrowDownLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RecentTransactionsProps {
  transactions: Transaction[] | null;
  currentUserUid: string;
  onReportFraud: (transaction: Transaction) => void;
}

const getRiskColor = (riskScore?: number) => {
    if (riskScore === undefined) return 'border-transparent';
    if (riskScore > 80) return 'border-red-500';
    if (riskScore > 50) return 'border-yellow-500';
    return 'border-transparent';
};

export function RecentTransactions({
  transactions,
  currentUserUid,
  onReportFraud,
}: RecentTransactionsProps) {
  if (transactions === null) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <Loader2 className="h-4 w-3/4 animate-spin" />
                  <Loader2 className="h-4 w-1/2 animate-spin" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial movements.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
              <Link href="/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {transactions.map((tx, index) => {
                  const isSent = tx.type === 'sent';
                  const peer = isSent ? tx.to : tx.from;
                  return (
                    <div key={tx.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <div className={cn("flex items-center justify-between gap-4 py-2 border-l-4", getRiskColor(tx.riskScore))}>
                              <div className="flex items-center gap-4 pl-3">
                                  <div className={cn(
                                      'flex h-10 w-10 items-center justify-center rounded-full',
                                      isSent ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'
                                  )}>
                                      {isSent ? <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" /> : <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />}
                                  </div>
                                  <div className="flex-1">
                                      <p className="font-semibold">{isSent ? `To: ${peer.name}` : `From: ${peer.name}`}</p>
                                      <p className="text-sm text-muted-foreground">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                                  </div>
                              </div>
                            <div className="text-right">
                              <p className={cn('font-bold', isSent ? 'text-destructive' : 'text-green-600')}>
                                {isSent ? '-' : '+'}
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                              </p>
                              <Button variant="ghost" size="sm" className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent" onClick={() => onReportFraud(tx)}>
                                <ShieldAlert className="mr-1 h-3 w-3" />
                                Report
                              </Button>
                            </div>
                          </div>
                        </TooltipTrigger>
                        {tx.riskReason && (
                          <TooltipContent side="left">
                            <p className='text-xs font-semibold'>AI Risk Analysis:</p>
                            <p className='text-xs'>{tx.riskReason}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {index < transactions.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-md border border-dashed">
              <p className="text-muted-foreground">No transactions yet.</p>
              <p className="text-sm text-muted-foreground">Send or receive money to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
