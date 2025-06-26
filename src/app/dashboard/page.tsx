"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import Link from "next/link";
import { useTransactions } from "@/contexts/transactions-context";
import { ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Valor",
  },
  Alimentação: {
    label: "Alimentação",
    color: "hsl(var(--chart-1))",
  },
  Moradia: {
    label: "Moradia",
    color: "hsl(var(--chart-2))",
  },
  Transporte: {
    label: "Transporte",
    color: "hsl(var(--chart-3))",
  },
  Lazer: {
    label: "Lazer",
    color: "hsl(var(--chart-4))",
  },
  Outros: {
    label: "Outros",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;


export default function DashboardPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { transactions } = useTransactions();

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const {
        saldoAtual,
        gastosMes,
        recentTransactions,
        chartData,
        topCategory
    } = useMemo(() => {
        const saldoAtual = transactions.reduce((acc, t) => {
            return t.type === 'entrada' ? acc + t.amount : acc - t.amount;
        }, 0);

        const monthlyTransactions = transactions.filter(t => isSameMonth(new Date(t.date), currentDate));

        const gastosMes = monthlyTransactions
            .filter(t => t.type === 'saida')
            .reduce((acc, t) => acc + t.amount, 0);
        
        const recentTransactions = monthlyTransactions.slice(0, 5);

        const expensesByCategory = monthlyTransactions
            .filter(t => t.type === 'saida')
            .reduce((acc, t) => {
                const category = t.category in chartConfig ? t.category : "Outros";
                if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category] += t.amount;
                return acc;
            }, {} as Record<string, number>);

        const chartData = Object.entries(expensesByCategory).map(([category, value]) => ({
            category,
            value,
            fill: (chartConfig[category as keyof typeof chartConfig] as any)?.color || (chartConfig["Outros"] as any).color,
        }));
        
        const topCategory = chartData.reduce((top, current) => {
            if (current.value > top.value) {
                return current;
            }
            return top;
        }, { category: 'Nenhuma', value: 0, fill: '' });

        return { saldoAtual, gastosMes, recentTransactions, chartData, topCategory };

    }, [transactions, currentDate]);

    // Mocked data for now, as it's not directly related to transactions list yet
    const contasVencer = 250.75;
    const progressoSaldo = 75;
    const progressoGastos = 50;

    const formattedDate = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{capitalizedDate}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-7 w-7">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Mês Anterior</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Próximo Mês</span>
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card>
                <CardHeader className="pb-2">
                <CardDescription>Saldo Atual</CardDescription>
                <CardTitle className="text-4xl">{saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-xs text-muted-foreground">+25% do último mês</div>
                </CardContent>
                <CardFooter>
                <Progress value={progressoSaldo} aria-label={`${progressoSaldo}% de aumento`} />
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                <CardDescription>Gastos deste Mês</CardDescription>
                <CardTitle className="text-4xl">{gastosMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-xs text-muted-foreground">+10% do último mês</div>
                </CardContent>
                <CardFooter>
                <Progress value={progressoGastos} aria-label={`${progressoGastos}% de aumento`} />
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                <CardDescription>Contas a Vencer</CardDescription>
                <CardTitle className="text-4xl">{contasVencer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-xs text-muted-foreground">3 contas vencendo esta semana</div>
                </CardContent>
                <CardFooter>
                <Button size="sm" asChild>
                    <Link href="/dashboard/recurring">Ver Contas</Link>
                </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                <CardDescription>Sugestão da IA</CardDescription>
                <CardTitle className="text-lg">Economize no Supermercado</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-xs text-muted-foreground">Você pode economizar até R$50/mês.</div>
                </CardContent>
                <CardFooter>
                <Button size="sm" asChild>
                    <Link href="/dashboard/savings-ai">Saiba Mais</Link>
                </Button>
                </CardFooter>
            </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Uma lista de suas transações mais recentes neste mês.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{t.category}</Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                    <TableCell className={`text-right ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.type === 'saida' ? '-' : ''}
                                    {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhuma transação neste mês.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end">
                <Button asChild>
                    <Link href="/dashboard/expenses">Ver Todas as Transações <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                </CardFooter>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
                <CardDescription>Sua distribuição de gastos para este mês.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={chartData} dataKey="value" nameKey="category" innerRadius={60} strokeWidth={5}>
                            {chartData.map((entry) => (
                                <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                    {topCategory.category !== 'Nenhuma' ? (
                        <>
                        <div className="flex w-full items-center gap-2 font-medium leading-none">
                            Principal Categoria: {topCategory.category}
                        </div>
                        <div className="flex w-full items-center gap-2 leading-none text-muted-foreground">
                            Você gastou {topCategory.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em {topCategory.category.toLowerCase()} este mês.
                        </div>
                        </>
                    ) : (
                        <div className="leading-none text-muted-foreground">
                            Não há dados de gastos para este mês.
                        </div>
                    )}
                </CardFooter>
            </Card>
            </div>
        </div>
    );
}
