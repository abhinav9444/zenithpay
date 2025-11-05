export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  balance: number;
  accountNumber: string;
  history: {
    totalTransactions: number;
    averageAmount: number;
  }
}

export interface Transaction {
  id: string;
  from: { uid: string; name: string; email: string };
  to: { uid:string; name: string; email: string };
  amount: number;
  date: string; // ISO string
  description: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'sent' | 'received';
  fraudReported?: boolean;
  fraudReason?: string;
  riskScore?: number;
  riskReason?: string;
}

export interface UserHistory {
  avgAmount: number;
  transactions: Transaction[];
}
