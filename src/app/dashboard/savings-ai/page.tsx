"use client";

import { useState, useCallback } from "react";
import { format, differenceInMonths, addMonths, isSameMonth } from "date-fns";
import { Sparkles, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/contexts/transactions-context";
import { useLoans } from "@/hooks/use-loans";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { getSavingsSuggestion } from "@/ai/flows/savings-suggestion-flow";
import type { SavingsSuggestionInput } from "@/ai/flows/savings-suggestion-flow";

export default function SavingsAIPage() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { transactions, loading: transactionsLoading } = useTransactions();
  const { loans, loading: loansLoading } = useLoans();
  const { recurringTransactions, loading: recurringTransactionsLoading } = useRecurringTransactions();
  const { cards, loading: cardsLoading } = useCreditCards();

  const isDataLoading = transactionsLoading || loansLoading || recurringTransactionsLoading || cardsLoading;

  const calculatePaidInstallments = (contractDate: Date) => {
    const monthsPassed = differenceInMonths(new Date(), new Date(contractDate));
    return monthsPassed < 0 ? 0 : monthsPassed + 1;
  };

  const calculateCardBillTotals = useCallback(() => {
    const totals = new Map<string, number>();
    const today = new Date();

    cards.forEach(card => {
        let currentMonthBill = 0;
        const cardTransactions = transactions.filter(
          (t) => t.paymentMethod === 'credit_card' && t.creditCardId === card.id
        );

        cardTransactions.forEach((purchase) => {
            if (!purchase.installments || purchase.installments === 0) return;

            const installmentAmount = purchase.amount / purchase.installments;
            const purchaseDate = new Date(purchase.date);
            
            const firstBillMonthOffset = purchaseDate.getDate() > card.closingDay ? 1 : 0;
            
            for (let i = 0; i < purchase.installments; i++) {
                const installmentBillDate = addMonths(purchaseDate, firstBillMonthOffset + i);

                if (isSameMonth(installmentBillDate, today)) {
                    currentMonthBill += installmentAmount;
                }
            }
        });
        totals.set(card.id, currentMonthBill);
    });
    return totals;
  }, [cards, transactions]);

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    const cardBillTotals = calculateCardBillTotals();

    const inputData: SavingsSuggestionInput = {
      transactions: transactions.slice(0, 50).map(t => ({
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: format(new Date(t.date), "dd/MM/yyyy"),
      })),
      loans: loans.map(l => ({
        institutionName: l.institutionName,
        installmentAmount: l.installmentAmount,
        totalInstallments: l.totalInstallments,
        paidInstallments: calculatePaidInstallments(l.contractDate),
      })),
      recurringTransactions: recurringTransactions.map(rt => ({
        description: rt.description,
        amount: rt.amount,
        category: rt.category,
      })),
      creditCards: cards.map(c => ({
        name: c.name,
        currentBill: cardBillTotals.get(c.id) ?? 0,
      }))
    };

    try {
      const result = await getSavingsSuggestion(inputData);
      setSuggestion(result.suggestion);
    } catch (e) {
      console.error("Error fetching savings suggestion:", e);
      setError("Ocorreu um erro ao gerar as sugestões. Por favor, tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sugestões de Economia com IA</CardTitle>
        <CardDescription>
            Receba uma análise personalizada de suas finanças e dicas práticas para otimizar suas economias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Carregando seus dados financeiros...</p>
          </div>
        ) : (
          <>
            {suggestion && (
                <div className="mt-6 rounded-lg border bg-muted/20 p-4 md:p-6">
                    <pre className="font-sans text-sm whitespace-pre-wrap">{suggestion}</pre>
                </div>
            )}

            {isLoading && (
              <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                      </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-[80%]" />
              </div>
            )}
            
            {error && (
              <div className="mt-4 text-center text-destructive">
                <p>{error}</p>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Button onClick={handleGetSuggestion} disabled={isLoading || isDataLoading}>
                {isLoading ? (
                    "Analisando..."
                ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {suggestion ? "Gerar Novas Sugestões" : "Gerar Sugestões"}
                    </>
                )}
              </Button>
            </div>

            {!suggestion && !isLoading && (
                 <div className="mt-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Bot className="h-16 w-16 mb-4" />
                    <p className="max-w-md">
                        Clique no botão para que nossa IA generativa analise seus dados de renda e gastos e forneça sugestões personalizadas sobre como otimizar suas economias.
                    </p>
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
