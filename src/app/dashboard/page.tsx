"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import Link from "next/link";
import { useTransactions } from "@/contexts/transactions-context";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { ChartConfig } from "@/components/ui/chart";
import { AddTransactionButton } from "@/components/add-transaction-button";

const chartConfig = {
  value: { label: "Valor" },
  Alimentação: { label: "Alimentação", color: "hsl(var(--chart-1))" },
  Moradia: { label: "Moradia", color: "hsl(var(--chart-2))" },
  Transporte: { label: "Transporte", color: "hsl(var(--chart-3))" },
  Lazer: { label: "Lazer", color: "hsl(var(--chart-4))" },
  "Cartão de Crédito": { label: "Cartão de Crédito", color: "hsl(var(--chart-5))" },
  Outros: { label: "Outros", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

export default function DashboardPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { transactions, loading: transactionsLoading } = useTransactions();
    const { cards, loading: cardsLoading } = useCreditCards();

    const loading = transactionsLoading || cardsLoading;

    const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const {
        balancoMes,
        receitaMes,
        gastosMes,
        recentTransactions,
        chartData,
        topCategory
    } = useMemo(() => {
        // Direct income for the month
        const receitaMes = transactions
            .filter(t => t.type === 'entrada' && isSameMonth(new Date(t.date), currentDate))
            .reduce((acc, t) => acc + t.amount, 0);

        // Direct money expenses for the month
        const moneyExpenses = transactions
            .filter(t => t.type === 'saida' && (t.paymentMethod === 'money' || !t.paymentMethod) && isSameMonth(new Date(t.date), currentDate));

        // Calculate credit card expenses for the month's bill
        let creditCardExpensesForMonth = 0;
        const creditCardPurchases = transactions.filter(t => t.paymentMethod === 'credit_card');

        creditCardPurchases.forEach(purchase => {
            const card = cards.find(c => c.id === purchase.creditCardId);
            if (!card || !purchase.installments) return;

            const installmentAmount = purchase.amount / purchase.installments;
            const purchaseDate = new Date(purchase.date);

            for (let i = 0; i < purchase.installments; i++) {
                const installmentDate = addMonths(purchaseDate, i);
                
                // Determine the closing date for this specific installment
                let closingDateForInstallment = new Date(installmentDate.getFullYear(), installmentDate.getMonth(), card.closingDay);

                // If the purchase was made after the closing day in its month, the first installment is on the next bill
                if(purchaseDate.getDate() > card.closingDay && i === 0) {
                   closingDateForInstallment = addMonths(closingDateForInstallment, 1);
                } else if (i > 0) {
                   // For subsequent installments, they just fall on the subsequent months' closing dates
                   closingDateForInstallment = addMonths(new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), card.closingDay), i);
                }

                if (isSameMonth(closingDateForInstallment, currentDate)) {
                    creditCardExpensesForMonth += installmentAmount;
                }
            }
        });

        const gastosMes = moneyExpenses.reduce((acc, t) => acc + t.amount, 0) + creditCardExpensesForMonth;
        const balancoMes = receitaMes - gastosMes;

        // Combine money expenses and a summary of credit card expenses for the chart
        const expensesByCategory = moneyExpenses.reduce((acc, t) => {
            const category = t.category in chartConfig ? t.category : "Outros";
            if (!acc[category]) acc[category] = 0;
            acc[category] += t.amount;
            return acc;
        }, {} as Record<string, number>);

        if (creditCardExpensesForMonth > 0) {
            expensesByCategory["Cartão de Crédito"] = creditCardExpensesForMonth;
        }

        const chartData = Object.entries(expensesByCategory).map(([category, value]) => ({
            category,
            value,
            fill: (chartConfig[category as keyof typeof chartConfig] as any)?.color || (chartConfig["Outros"] as any).color,
        }));
        
        const topCategory = chartData.length > 0 ? chartData.reduce((top, current) => current.value > top.value ? current : top) : { category: 'Nenhuma', value: 0 };
        
        const recentTransactions = transactions
            .filter(t => isSameMonth(new Date(t.date), currentDate))
            .slice(0, 5);

        return { balancoMes, receitaMes, gastosMes, recentTransactions, chartData, topCategory };

    }, [transactions, cards, currentDate]);

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
                    <CardHeader className="pb-2"><CardDescription>Sugestão da IA</CardDescription><CardTitle className="text-lg">Economize no Supermercado</CardTitle></CardHeader>
                    <CardContent><div className="text-xs text-muted-foreground">Você pode economizar até R$50/mês.</div></CardContent>
                    <CardFooter><Button size="sm" asChild><Link href="/dashboard/savings-ai">Saiba Mais</Link></Button></CardFooter>
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
