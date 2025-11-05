
import type { User, Transaction, UserHistory } from './types';

// Helper to generate a random 6-digit alphanumeric account number
const generateAccountNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// In-memory store to simulate a database. Starts empty.
let users: User[] = [];
let transactions: Transaction[] = [];

// --- User Functions ---

export const db_findUserBy = async (field: 'uid' | 'email' | 'accountNumber', value: string): Promise<User | undefined> => {
    const queryValue = value.toLowerCase();
    return users.find((user) => {
        if (field === 'uid') {
            return user.uid === value; // uid is case-sensitive
        }
        if (field === 'email') {
            return user.email.toLowerCase() === queryValue;
        }
        if (field === 'accountNumber') {
            // Ensure comparison is case-insensitive for account numbers
            return user.accountNumber.toLowerCase() === queryValue;
        }
        return false;
    });
};

export const db_addUser = async (newUser: { uid: string; email: string; name: string; photoURL: string }): Promise<User> => {
  const existingUser = await db_findUserBy('uid', newUser.uid);
  if (existingUser) {
    // If user exists, ensure they have history and account number, then return
    if (!existingUser.accountNumber) {
        existingUser.accountNumber = generateAccountNumber();
    }
    if (!existingUser.history) {
        existingUser.history = { totalTransactions: 0, averageAmount: 0 };
    }
    return existingUser;
  }

  // Generate a truly unique account number
  let newAccountNumber = generateAccountNumber();
  while(await db_findUserBy('accountNumber', newAccountNumber)){
    newAccountNumber = generateAccountNumber();
  }

  const user: User = {
    ...newUser,
    balance: 1000, // Every new user gets a starting balance of $1000
    accountNumber: newAccountNumber,
    history: { totalTransactions: 0, averageAmount: 0 }
  };
  users.push(user);
  console.log('New user added:', user);
  console.log('Current users:', users);
  return user;
};

export const db_updateUserBalance = async (uid: string, newBalance: number): Promise<boolean> => {
  const userIndex = users.findIndex((user) => user.uid === uid);
  if (userIndex !== -1) {
    users[userIndex].balance = newBalance;
    
    // Update user history after a balance change
    const userTransactions = await db_getTransactionsForUser(uid);
    const sentTransactions = userTransactions.filter(tx => tx.type === 'sent');
    const totalSent = sentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = sentTransactions.length;
    const averageAmount = totalTransactions > 0 ? totalSent / totalTransactions : 0;
    
    users[userIndex].history = {
        totalTransactions,
        averageAmount
    }

    return true;
  }
  return false;
};

export const db_getUserHistory = async (uid: string): Promise<UserHistory> => {
    const userTransactions = await db_getTransactionsForUser(uid);
    const sentTransactions = userTransactions.filter(tx => tx.type === 'sent');
    
    if (sentTransactions.length === 0) {
        return {
            avgAmount: 0,
            transactions: []
        };
    }

    const totalSent = sentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const avgAmount = totalSent / sentTransactions.length;

    return {
        avgAmount,
        transactions: sentTransactions
    }
}


// --- Transaction Functions ---

export const db_getTransactionsForUser = async (uid: string): Promise<Transaction[]> => {
  return transactions
    .filter((txn) => txn.from.uid === uid || txn.to.uid === uid)
    .map((txn) => ({
      ...txn,
      type: txn.from.uid === uid ? 'sent' : 'received',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const db_addTransaction = async (transaction: Omit<Transaction, 'id' | 'type'>): Promise<Transaction> => {
  const newTransaction: Transaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    ...transaction,
    type: 'sent' // This is contextual and will be overridden in getTransactionsForUser
  };
  transactions.unshift(newTransaction);
  // After adding a transaction, re-calculate history for both users
  await db_updateUserBalance(transaction.from.uid, (await db_findUserBy('uid', transaction.from.uid))!.balance);
  await db_updateUserBalance(transaction.to.uid, (await db_findUserBy('uid', transaction.to.uid))!.balance);
  return newTransaction;
};

export const db_findTransactionById = async (id: string): Promise<Transaction | undefined> => {
  return transactions.find((txn) => txn.id === id);
}

export const db_updateTransactionFraudStatus = async (id: string, reason: string): Promise<boolean> => {
    const txIndex = transactions.findIndex((txn) => txn.id === id);
    if(txIndex !== -1){
        transactions[txIndex].fraudReported = true;
        transactions[txIndex].fraudReason = reason;
        return true;
    }
    return false;
}
