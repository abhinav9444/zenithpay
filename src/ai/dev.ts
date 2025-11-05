'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/report-fraudulent-transaction.ts';
import '@/ai/flows/analyze-transaction-risk.ts';
