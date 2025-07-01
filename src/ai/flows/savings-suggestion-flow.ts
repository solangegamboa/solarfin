'use server';
/**
 * @fileOverview An AI flow to generate personalized savings suggestions.
 *
 * - getSavingsSuggestion - A function that handles the suggestion generation process.
 * - SavingsSuggestionInput - The input type for the getSavingsSuggestion function.
 * - SavingsSuggestionOutput - The return type for the getSavingsSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TransactionSchema = z.object({
    description: z.string(),
    amount: z.number(),
    type: z.enum(['entrada', 'saida']),
    category: z.string(),
    date: z.string(),
});

const LoanSchema = z.object({
    institutionName: z.string(),
    installmentAmount: z.number(),
    totalInstallments: z.number(),
    paidInstallments: z.number(),
});

const RecurringTransactionSchema = z.object({
    description: z.string(),
    amount: z.number(),
    category: z.string(),
});

const CreditCardSchema = z.object({
    name: z.string(),
    currentBill: z.number(),
});


const SavingsSuggestionInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe("List of user's transactions for the last period."),
  loans: z.array(LoanSchema).describe("List of user's active loans."),
  recurringTransactions: z.array(RecurringTransactionSchema).describe("List of user's fixed monthly expenses."),
  creditCards: z.array(CreditCardSchema).describe("List of user's credit cards and their current bill amount."),
});
export type SavingsSuggestionInput = z.infer<typeof SavingsSuggestionInputSchema>;

const SavingsSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('The full savings suggestion in Markdown format. It should include an analysis of spending, positive points, areas for improvement, and a list of actionable tips.'),
});
export type SavingsSuggestionOutput = z.infer<typeof SavingsSuggestionOutputSchema>;

export async function getSavingsSuggestion(input: SavingsSuggestionInput): Promise<SavingsSuggestionOutput> {
  return savingsSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsSuggestionPrompt',
  input: {schema: SavingsSuggestionInputSchema},
  output: {schema: SavingsSuggestionOutputSchema},
  prompt: `Você é um consultor financeiro especialista em finanças pessoais para o público brasileiro. Seu objetivo é analisar os dados financeiros de um usuário e fornecer um relatório claro, otimista e acionável para ajudá-lo a economizar dinheiro.

Use o seguinte formato Markdown para sua resposta:

# Análise Financeira e Sugestões de Economia

## 📈 Análise Geral
*   Forneça um resumo conciso da situação financeira do usuário com base nos dados.
*   Calcule o total de receitas e o total de despesas (some transações de saída, despesas recorrentes, faturas de cartão e parcelas de empréstimos).
*   Apresente o balanço (Receitas - Despesas Totais).

## 👍 Pontos Positivos
*   Identifique e elogie 1 ou 2 hábitos financeiros positivos do usuário. Seja encorajador.

## 💡 Pontos de Melhoria
*   Identifique de 1 a 3 áreas onde o usuário pode ter mais atenção ou potencial de economia, como a categoria com maiores gastos. Seja construtivo e evite um tom de crítica.

## 🎯 Dicas Acionáveis para Economizar
*   Forneça de 3 a 5 dicas práticas e personalizadas. As dicas devem ser específicas para os dados do usuário. Por exemplo, se ele gasta muito com "Transporte", sugira otimizar rotas ou usar transporte público. Se a fatura do cartão está alta, sugira analisar os lançamentos.

---

**Dados Financeiros do Usuário:**

**Transações:**
{{#if transactions}}
{{#each transactions}}
- {{this.description}} ({{this.category}}): {{this.amount}} BRL ({{this.type}}) em {{this.date}}
{{/each}}
{{else}}
- Nenhuma transação registrada.
{{/if}}

**Empréstimos Ativos:**
{{#if loans}}
{{#each loans}}
- {{this.institutionName}}: Parcela de {{this.installmentAmount}} BRL (Pagas {{this.paidInstallments}}/{{this.totalInstallments}})
{{/each}}
{{else}}
- Nenhum empréstimo ativo.
{{/if}}

**Despesas Recorrentes:**
{{#if recurringTransactions}}
{{#each recurringTransactions}}
- {{this.description}} ({{this.category}}): {{this.amount}} BRL
{{/each}}
{{else}}
- Nenhuma despesa recorrente registrada.
{{/if}}

**Faturas de Cartão de Crédito (Mês Atual):**
{{#if creditCards}}
{{#each creditCards}}
- Cartão {{this.name}}: {{this.currentBill}} BRL
{{/each}}
{{else}}
- Nenhum cartão de crédito com fatura.
{{/if}}
`,
});

const savingsSuggestionFlow = ai.defineFlow(
  {
    name: 'savingsSuggestionFlow',
    inputSchema: SavingsSuggestionInputSchema,
    outputSchema: SavingsSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
