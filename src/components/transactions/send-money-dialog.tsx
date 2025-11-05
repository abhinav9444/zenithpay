
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { sendMoney } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  receiver: z.string().min(6, 'Account number must be 6 characters.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().min(1, 'Description is required.'),
});

interface SendMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendMoneyDialog({ open, onOpenChange }: SendMoneyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [warning, setWarning] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<z.infer<typeof formSchema> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiver: '',
      amount: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setWarning(null);
      setFormValues(null);
    }
  }, [open, form]);

  const handleTransaction = (values: z.infer<typeof formSchema>, bypassWarning = false) => {
    if (!user) return;
    setFormValues(values);

    startTransition(async () => {
      const result = await sendMoney(user.uid, values.receiver, values.amount, values.description, bypassWarning);

      if (result?.warning) {
        setWarning(result.message);
        return;
      }
      
      if (result?.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result?.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    handleTransaction(values, false);
  };

  const onConfirmWarning = () => {
    if (formValues) {
        handleTransaction(formValues, true);
    }
    setWarning(null);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Money</DialogTitle>
          <DialogDescription>
            Transfer funds to another user's 6-digit account number.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="receiver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiver's Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AB12CD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="For dinner last night" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!warning} onOpenChange={() => setWarning(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                {warning}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setWarning(null)} disabled={isPending}>
                Cancel
            </Button>
            <AlertDialogAction onClick={onConfirmWarning} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, proceed
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
