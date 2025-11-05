'use client';

import type { Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TransactionsTableProps {
  transactions: Transaction[] | null;
  onReportFraud: (transaction: Transaction) => void;
}

const getRiskRowClass = (riskScore?: number) => {
    if (riskScore === undefined) return '';
    if (riskScore > 80) return 'bg-red-500/10 hover:bg-red-500/20';
    if (riskScore > 50) return 'bg-yellow-500/10 hover:bg-yellow-500/20';
    return '';
}

const getRiskBadgeVariant = (riskScore?: number) => {
    if (riskScore === undefined) return 'outline';
    if (riskScore > 80) return 'destructive';
    if (riskScore > 50) return 'secondary';
    return 'default';
}


export function TransactionsTable({
  transactions,
  onReportFraud,
}: TransactionsTableProps) {
  const renderSkeleton = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions === null ? renderSkeleton() : transactions.map((tx) => {
            const isSent = tx.type === 'sent';
            const peer = isSent ? tx.to : tx.from;
            const rowClass = tx.fraudReported ? "bg-destructive/20 hover:bg-destructive/30" : getRiskRowClass(tx.riskScore);
            return (
              <Tooltip key={tx.id}>
                <TooltipTrigger asChild>
                    <TableRow className={rowClass}>
                      <TableCell className="font-medium">{format(new Date(tx.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={isSent ? 'destructive' : 'secondary'} className={cn(isSent ? '' : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200')}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{isSent ? 'To: ' : 'From: '}{peer.name}</div>
                        <div className="text-sm text-muted-foreground">{tx.description}</div>
                      </TableCell>
                      <TableCell className={cn('text-right font-bold', isSent ? 'text-destructive' : 'text-green-600')}>
                        {isSent ? '-' : '+'}
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'outline'} className={cn(tx.status === 'completed' ? 'bg-green-600' : '')}>{tx.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {tx.riskScore !== undefined ? (
                            <Badge variant={getRiskBadgeVariant(tx.riskScore)}>
                                {tx.riskScore}
                            </Badge>
                        ) : <Badge variant="outline">N/A</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReportFraud(tx)}
                          disabled={!!tx.fraudReported}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {tx.fraudReported ? 'Reported' : 'Report Fraud'}
                        </Button>
                      </TableCell>
                    </TableRow>
                </TooltipTrigger>
                {tx.riskReason && (
                    <TooltipContent>
                         <p className='text-xs font-semibold'>AI Risk Analysis:</p>
                         <p className='text-xs'>{tx.riskReason}</p>
                    </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
