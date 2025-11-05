
'use server';

import { revalidatePath } from 'next/cache';
import {
  db_findUserBy,
  db_addUser,
  db_getTransactionsForUser,
  db_addTransaction,
  db_updateUserBalance,
  db_findTransactionById,
  db_updateTransactionFraudStatus,
  db_getUserHistory,
} from './data';
import type { User, Transaction } from './types';
import { reportFraudulentTransaction } from '@/ai/flows/report-fraudulent-transaction';
import { analyzeTransactionRisk } from '@/ai/flows/analyze-transaction-risk';

export async function getUser(uid: string): Promise<User | null> {
  const user = await db_findUserBy('uid', uid);
  return user || null;
}

export async function getTransactions(uid: string): Promise<Transaction[]> {
  return await db_getTransactionsForUser(uid);
}

export async function addUser(user: { uid: string; email: string; name: string; photoURL: string }): Promise<User> {
  return await db_addUser(user);
}

export async function sendMoney(
  senderUid: string,
  receiverAccountNumber: string,
  amount: number,
  description: string,
  bypassWarning = false
): Promise<{ success: boolean; message: string; warning?: boolean }> {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be positive.' };
  }

  const sender = await db_findUserBy('uid', senderUid);
  if (!sender) {
    return { success: false, message: 'Sender not found.' };
  }

  if (sender.balance < amount) {
    return { success: false, message: 'Insufficient balance.' };
  }

  const receiver = await db_findUserBy('accountNumber', receiverAccountNumber);
  
  if (!receiver) {
    return { success: false, message: 'Receiver account number not found.' };
  }

  if (sender.uid === receiver.uid) {
    return { success: false, message: "You cannot send money to yourself." };
  }
  
  // Fraud Detection Logic
  if (!bypassWarning) {
    const senderHistory = await db_getUserHistory(sender.uid);
    
    // 1. Velocity Check
    if (senderHistory.transactions.length > 0) {
        const oneMinuteAgo = Date.now() - 60 * 1000;
        const recentTxCount = senderHistory.transactions.filter(tx => new Date(tx.date).getTime() > oneMinuteAgo).length;
        if (recentTxCount >= 3) {
            return { success: false, warning: true, message: "You're making transfers very quickly. Please confirm you want to proceed."}
        }
    }

    // 2. Anomaly Check
    if (senderHistory.avgAmount > 0 && amount > senderHistory.avgAmount * 5) {
        return { success: false, warning: true, message: `This transaction of $${amount.toFixed(2)} is much larger than your average of $${senderHistory.avgAmount.toFixed(2)}. Please confirm you want to proceed.`}
    }
  }
  
  // AI Risk Analysis
  const historySummary = `User has made ${sender.history.totalTransactions} transactions with an average amount of $${sender.history.averageAmount.toFixed(2)}.`;
  const transactionDetails = `Amount: $${amount}, To: ${receiver.name}, Description: ${description}`;

  const riskAnalysis = await analyzeTransactionRisk({
    transactionDetails,
    senderHistory: historySummary,
  });

  // Update balances
  await db_updateUserBalance(sender.uid, sender.balance - amount);
  await db_updateUserBalance(receiver.uid, receiver.balance + amount);

  // Record transaction
  await db_addTransaction({
    from: { uid: sender.uid, name: sender.name, email: sender.email },
    to: { uid: receiver.uid, name: receiver.name, email: receiver.email },
    amount,
    date: new Date().toISOString(),
    description,
    status: 'completed',
    riskScore: riskAnalysis.riskScore,
    riskReason: riskAnalysis.riskReason,
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  
  return { success: true, message: 'Transaction successful.' };
}


export async function reportTransactionAsFraud(transactionId: string, userReport: string): Promise<{
    success: boolean,
    message: string,
    fraudulent?: boolean;
    reason?: string;
}> {
  const transaction = await db_findTransactionById(transactionId);
  if(!transaction) {
    return { success: false, message: 'Transaction not found.' };
  }

  const transactionDetails = `Amount: ${transaction.amount}, To: ${transaction.to.name}, From: ${transaction.from.name}, Date: ${transaction.date}, Description: ${transaction.description}`;

  try {
    const aiResult = await reportFraudulentTransaction({
      transactionDetails,
      userReport,
    });
    
    await db_updateTransactionFraudStatus(transactionId, aiResult.reason);

    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, message: 'Fraud report submitted and analyzed.', ...aiResult };
  } catch (error) {
    console.error("AI Fraud Analysis Failed:", error);
    return { success: false, message: 'Failed to analyze fraud report.' };
  }
}
