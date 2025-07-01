
"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, isSameMonth, startOfMonth, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import Link from "next/link";
import { useTransactions } from "@/contexts/transactions-context";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { useLoans } from "@/hooks/use-loans";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import { ChartConfig } from "@/components/ui/chart";
import { AddTransactionButton } from "@/components/add-transaction-button";

export default function DashboardPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { transactions, loading: transactionsLoading } = useTransactions();
    const { cards, loading: cardsLoading } = useCreditCards();
    const { loans, loading: loansLoading } = useLoans();
    const { recurringTransactions, loading: recurringTransactionsLoading } = useRecurringTransactions();

    const loading = transactionsLoading || cardsLoading || loansLoading || recurringTransactionsLoading;

    const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const {
        balancoMes,
        receitaMes,
        gastosMes,
        recentTransactions,
        chartData,
        chartConfig,
        topCategory,
        forecastedExpenses,
        creditCardBillTotal,
        loanInstallmentsTotal,
        recurringExpensesTotal
    } = useMemo(() => {
        // Direct income for the month
        const receitaMes = transactions
            .filter(t => t.type === 'entrada' && isSameMonth(new Date(t.date), currentDate))
            .reduce((acc, t) => acc + t.amount, 0);

        // Direct money expenses for the month
        const moneyExpenses = transactions
            .filter(t => t.type === 'saida' && (t.paymentMethod === 'money' || !t.paymentMethod) && isSameMonth(new Date(t.date), currentDate));

        // Calculate credit card expenses for the month's bill
        let creditCardBillTotal = 0;
        const creditCardPurchases = transactions.filter(t => t.paymentMethod === 'credit_card');

        creditCardPurchases.forEach(purchase => {
            const card = cards.find(c => c.id === purchase.creditCardId);
            if (!card || !purchase.installments || purchase.installments === 0) return;

            const purchaseDate = new Date(purchase.date);
            // Robustness: Check for invalid dates to prevent server-side crashes
            if (isNaN(purchaseDate.getTime())) {
                return; 
            }

            const installmentAmount = purchase.amount / purchase.installments;
            const firstBillMonthOffset = purchaseDate.getDate() > card.closingDay ? 1 : 0;
            
            for (let i = 0; i < purchase.installments; i++) {
                const installmentBillDate = addMonths(purchaseDate, firstBillMonthOffset + i);

                if (isSameMonth(installmentBillDate, currentDate)) {
                    creditCardBillTotal += installmentAmount;
                }
            }
        });

        const gastosMes = moneyExpenses.reduce((acc, t) => acc + t.amount, 0) + creditCardBillTotal;
        const balancoMes = receitaMes - gastosMes;

        // --- DYNAMIC CHART DATA AND CONFIG GENERATION ---
        const expensesByCategory = moneyExpenses.reduce((acc, t) => {
            const category = t.category || "Outros";
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += t.amount;
            return acc;
        }, {} as Record<string, number>);

        if (creditCardBillTotal > 0) {
            expensesByCategory["Cartão de Crédito"] = creditCardBillTotal;
        }

        const availableColors = Array.from({ length: 10 }, (_, i) => `hsl(var(--chart-${i + 1}))`);

        const dynamicChartConfig: ChartConfig = {
            value: { label: "Valor" },
        };

        const sortedCategories = Object.keys(expensesByCategory).sort(
            (a, b) => expensesByCategory[b] - expensesByCategory[a]
        );

        let colorIndex = 0;
        const chartData = sortedCategories.map((category) => {
            const color = availableColors[colorIndex % availableColors.length];
            colorIndex++;

            dynamicChartConfig[category] = {
                label: category,
                color: color,
            };
            
            return {
                category,
                value: expensesByCategory[category],
                fill: color,
            };
        });

        const topCategory = chartData.length > 0 
            ? chartData.reduce((top, current) => current.value > top.value ? current : top) 
            : { category: 'Nenhuma', value: 0 };

        
        const recentTransactions = transactions
            .filter(t => isSameMonth(new Date(t.date), currentDate))
            .slice(0, 5);
        
        // --- New Forecast Calculations ---
        const loanInstallmentsTotal = loans.reduce((acc, loan) => {
            const contractDate = new Date(loan.contractDate);
            // Robustness: Check for invalid dates
            if (isNaN(contractDate.getTime())) {
                return acc;
            }
            const paidInstallments = differenceInMonths(currentDate, contractDate) + 1;
            if (paidInstallments > 0 && paidInstallments <= loan.totalInstallments) {
                return acc + loan.installmentAmount;
            }
            return acc;
        }, 0);

        const recurringExpensesTotal = recurringTransactions
            .filter(rt => rt.paymentMethod === 'money')
            .reduce((acc, rt) => acc + rt.amount, 0);

        const forecastedExpenses = creditCardBillTotal + loanInstallmentsTotal + recurringExpensesTotal;


        return { 
            balancoMes, 
            receitaMes, 
            gastosMes, 
            recentTransactions, 
            chartData, 
            chartConfig: dynamicChartConfig,
            topCategory,
            forecastedExpenses,
            creditCardBillTotal,
            loanInstallmentsTotal,
            recurringExpensesTotal
        };

    }, [transactions, cards, currentDate, loans, recurringTransactions]);

    const formattedDate = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{capitalizedDate}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-7 w-7"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Mês Anterior</span></Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-7 w-7"><ChevronRight className="h-4 w-4" /><span className="sr-only">Próximo Mês</span></Button>
                    <AddTransactionButton />
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Balanço do Mês</CardDescription>{loading ? <Skeleton className="h-10 w-3/4" /> : <CardTitle className="text-4xl">{balancoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>}</CardHeader>
                    <CardContent><div className="text-xs text-muted-foreground">Receitas menos despesas do mês</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Receitas do Mês</CardDescription>{loading ? <Skeleton className="h-10 w-3/4" /> : <CardTitle className="text-4xl">{receitaMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>}</CardHeader>
                    <CardContent><div className="text-xs text-muted-foreground">Total de entradas no mês</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardDescription>Gastos do Mês</CardDescription>{loading ? <Skeleton className="h-10 w-3/4" /> : <CardTitle className="text-4xl">{gastosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>}</CardHeader>
                    <CardContent><div className="text-xs text-muted-foreground">Total de saídas e faturas do mês</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Previsão de Gastos</CardDescription>
                        {loading ? <Skeleton className="h-10 w-3/4" /> : <CardTitle className="text-4xl">{forecastedExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex justify-between"><span>Fatura do Cartão</span><span>{creditCardBillTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                <div className="flex justify-between"><span>Empréstimos</span><span>{loanInstallmentsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                <div className="flex justify-between"><span>Despesas Recorrentes</span><span>{recurringExpensesTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader><CardTitle>Transações Recentes</CardTitle><CardDescription>Uma lista de suas transações mais recentes neste mês.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {loading ? (<TableRow><TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell></TableRow>) : recentTransactions.length > 0 ? (recentTransactions.map((t) => (<TableRow key={t.id}><TableCell className="font-medium">{t.description}</TableCell><TableCell><Badge variant="outline">{t.category}</Badge></TableCell><TableCell>{format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell><TableCell className={`text-right ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>{t.type === 'saida' ? '-' : ''}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma transação neste mês.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex justify-end"><Button asChild><Link href="/dashboard/expenses">Ver Todas as Transações <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></CardFooter>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Gastos por Categoria</CardTitle><CardDescription>Sua distribuição de gastos para este mês.</CardDescription></CardHeader>
                    <CardContent className="flex justify-center">
                        {loading ? (<div className="flex justify-center items-center h-[250px]"><Skeleton className="h-[250px] w-[250px] rounded-full" /></div>) : chartData.length > 0 ? (<ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]"><PieChart><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /><Pie data={chartData} dataKey="value" nameKey="category" innerRadius={60} strokeWidth={5}>{chartData.map((entry) => (<Cell key={`cell-${entry.category}`} fill={entry.fill} />))}</Pie></PieChart></ChartContainer>) : (<div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados de gastos.</div>)}
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                        {loading ? (<div className="w-full space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>) : topCategory.category !== 'Nenhuma' && topCategory.value > 0 ? (<><div className="flex w-full items-center gap-2 font-medium leading-none">Principal Categoria: {topCategory.category}</div><div className="flex w-full items-center gap-2 leading-none text-muted-foreground">Você gastou {topCategory.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em {topCategory.category.toLowerCase()} este mês.</div></>) : (<div className="leading-none text-muted-foreground">Não há dados de gastos para este mês.</div>)}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
