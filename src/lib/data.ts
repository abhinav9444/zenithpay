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

// In-memory store to simulate a database
let users: User[] = [
  {
    uid: 'user-1-uid',
    email: 'john.doe@example.com',
    name: 'John Doe',
    photoURL: 'https://picsum.photos/seed/user1/100/100',
    balance: 5000.75,
    accountNumber: 'AB12CD',
    history: { totalTransactions: 1, averageAmount: 75.50 }
  },
  {
    uid: 'user-2-uid',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    photoURL: 'https://picsum.photos/seed/user2/100/100',
    balance: 1250.25,
    accountNumber: 'EF34GH',
    history: { totalTransactions: 1, averageAmount: 250.00 }
  },
  {
    uid: 'user-3-uid',
    email: 'banker.bob@example.com',
    name: 'Banker Bob',
    photoURL: 'https://picsum.photos/seed/user3/100/100',
    balance: 1000000,
    accountNumber: 'IJ56KL',
    history: { totalTransactions: 1, averageAmount: 1000.00 }
  }
];

let transactions: Transaction[] = [
  {
    id: 'txn-1',
    from: { uid: 'user-2-uid', name: 'Jane Smith', email: 'jane.smith@example.com' },
    to: { uid: 'user-1-uid', name: 'John Doe', email: 'john.doe@example.com' },
    amount: 250.0,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Coffee supplies',
    status: 'completed',
    type: 'received',
    riskScore: 10,
    riskReason: 'Routine transaction to a known recipient.',
  },
  {
    id: 'txn-2',
    from: { uid: 'user-1-uid', name: 'John Doe', email: 'john.doe@example.com' },
    to: { uid: 'user-2-uid', name: 'Jane Smith', email: 'jane.smith@example.com' },
    amount: 75.5,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Dinner reimbursement',
    status: 'completed',
    type: 'sent',
    riskScore: 5,
    riskReason: 'Low amount to a frequent contact.',
  },
    {
    id: 'txn-3',
    from: { uid: 'user-3-uid', name: 'Banker Bob', email: 'banker.bob@example.com' },
    to: { uid: 'user-1-uid', name: 'John Doe', email: 'john.doe@example.com' },
    amount: 1000,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Initial deposit',
    status: 'completed',
    type: 'received',
    riskScore: 0,
    riskReason: 'Standard bank deposit.',
  },
];

// --- User Functions ---

export const db_findUserBy = async (field: 'uid' | 'email' | 'accountNumber', value: string): Promise<User | undefined> => {
    const queryValue = value.toLowerCase();
    return users.find((user) => {
        if (field === 'email') return user.email.toLowerCase() === queryValue;
        if (field === 'accountNumber') return user.accountNumber.toLowerCase() === queryValue;
        return user[field] === value;
    });
};

export const db_addUser = async (newUser: { uid: string; email: string; name: string; photoURL: string }): Promise<User> => {
  const existingUser = await db_findUserBy('uid', newUser.uid);
  if (existingUser) {
    if (!existingUser.accountNumber) {
        existingUser.accountNumber = generateAccountNumber();
    }
    if (!existingUser.history) {
        existingUser.history = { totalTransactions: 0, averageAmount: 0 };
    }
    return existingUser;
  }

  let newAccountNumber = generateAccountNumber();
  while(await db_findUserBy('accountNumber', newAccountNumber)){
    newAccountNumber = generateAccountNumber();
  }

  const user: User = {
    ...newUser,
    balance: 1000,
    accountNumber: newAccountNumber,
    history: { totalTransactions: 0, averageAmount: 0 }
  };
  users.push(user);
  return user;
};

export const db_updateUserBalance = async (uid: string, newBalance: number): Promise<boolean> => {
  const userIndex = users.findIndex((user) => user.uid === uid);
  if (userIndex !== -1) {
    users[userIndex].balance = newBalance;
    
    // Update user history
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
    id: `txn-${Date.now()}-${Math.random()}`,
    ...transaction,
    type: 'sent' 
  };
  transactions.unshift(newTransaction);
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
