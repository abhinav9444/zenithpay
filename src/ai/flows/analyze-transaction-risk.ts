'use server';
/**
 * @fileOverview Transaction risk analysis AI agent.
 *
 * - analyzeTransactionRisk - A function that analyzes a transaction and provides a risk assessment.
 * - AnalyzeTransactionRiskInput - The input type for the analyzeTransactionRisk function.
 * - AnalyzeTransactionRiskOutput - The return type for the analyzeTransactionRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTransactionRiskInputSchema = z.object({
  transactionDetails: z.string().describe('Details of the current transaction, including amount, recipient, and description.'),
  senderHistory: z.string().describe("A summary of the sender's recent transaction history, including average amount and number of transactions."),
});
export type AnalyzeTransactionRiskInput = z.infer<typeof AnalyzeTransactionRiskInputSchema>;

const AnalyzeTransactionRiskOutputSchema = z.object({
    riskScore: z.number().describe('A risk score from 0 (low) to 100 (high).'),
    riskReason: z.string().describe('A brief explanation for the assigned risk score, highlighting any anomalies.'),
});
export type AnalyzeTransactionRiskOutput = z.infer<typeof AnalyzeTransactionRiskOutputSchema>;


export async function analyzeTransactionRisk(
  input: AnalyzeTransactionRiskInput
): Promise<AnalyzeTransactionRiskOutput> {
  return analyzeTransactionRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTransactionRiskPrompt',
  input: {schema: AnalyzeTransactionRiskInputSchema},
  output: {schema: AnalyzeTransactionRiskOutputSchema},
  prompt: `You are a financial fraud detection expert. Analyze the following transaction based on the provided details and the sender's history. Provide a risk score from 0 to 100 and a brief reason.

Consider these factors:
- Is the transaction amount significantly higher than the sender's average?
- Is the transaction description suspicious (e.g., "urgent," "verify account," "unlock")?
- Does the sender's history show a sudden increase in transaction frequency or amount?

Transaction Details: {{{transactionDetails}}}
Sender History: {{{senderHistory}}}
`,
});

const analyzeTransactionRiskFlow = ai.defineFlow(
  {
    name: 'analyzeTransactionRiskFlow',
    inputSchema: AnalyzeTransactionRiskInputSchema,
    outputSchema: AnalyzeTransactionRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
