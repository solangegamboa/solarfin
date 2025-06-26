"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
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


const chartConfig = {
  value: {
    label: "Valor",
  },
  food: {
    label: "Alimentação",
    color: "hsl(var(--chart-1))",
  },
  housing: {
    label: "Moradia",
    color: "hsl(var(--chart-2))",
  },
  transport: {
    label: "Transporte",
    color: "hsl(var(--chart-3))",
  },
  entertainment: {
    label: "Lazer",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Outros",
    color: "hsl(var(--chart-5))",
  },
}

export default function DashboardPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    // Gera dados fictícios com base no mês
    const monthIndex = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Simula a mudança de dados
    const saldoAtual = 5329 + (monthIndex * 150) - 400;
    const gastosMes = 1329 + (monthIndex * 50) - 200;
    const contasVencer = 250.75 + (monthIndex * 20) - 50;
    const progressoSaldo = Math.max(0, Math.min(100, 25 + monthIndex * 2 - 5));
    const progressoGastos = Math.max(0, Math.min(100, 10 + monthIndex * 1 - 2));


    const transactions = [
        { type: 'Supermercado', category: 'Alimentação', amount: -75.42 - (monthIndex * 2), date: format(new Date(year, monthIndex, 20), 'yyyy-MM-dd') },
        { type: 'Salário', category: 'Renda', amount: 3000.00, date: format(new Date(year, monthIndex, 5), 'yyyy-MM-dd') },
        { type: 'Netflix', category: 'Lazer', amount: -15.99, date: format(new Date(year, monthIndex, 19), 'yyyy-MM-dd') },
        { type: 'Gasolina', category: 'Transporte', amount: -45.10 - (monthIndex * 1.5), date: format(new Date(year, monthIndex, 18), 'yyyy-MM-dd') },
        { type: 'Jantar Fora', category: 'Alimentação', amount: -120.00 - (monthIndex * 5), date: format(new Date(year, monthIndex, 17), 'yyyy-MM-dd') },
    ]

    const chartData = [
      { category: "Alimentação", value: Math.max(0, 400 + monthIndex * 10 - 20), fill: "var(--color-food)" },
      { category: "Moradia", value: Math.max(0, 1200 - monthIndex * 20), fill: "var(--color-housing)" },
      { category: "Transporte", value: Math.max(0, 250 + monthIndex * 5 - 10), fill: "var(--color-transport)" },
      { category: "Lazer", value: Math.max(0, 150 - monthIndex * 5), fill: "var(--color-entertainment)" },
      { category: "Outros", value: Math.max(0, 300 + monthIndex * 15 - 25), fill: "var(--color-other)" },
    ]

    const foodSpending = chartData.find(d => d.category === 'Alimentação')?.value || 0;

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
                <CardDescription>Uma lista de suas transações mais recentes.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((t, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-medium">{t.type}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{t.category}</Badge>
                            </TableCell>
                            <TableCell>{t.date}</TableCell>
                            <TableCell className={`text-right ${t.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                        </TableRow>
                        ))}
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
                    <div className="flex w-full items-center gap-2 font-medium leading-none">
                        Principal Categoria: Alimentação
                    </div>
                    <div className="flex w-full items-center gap-2 leading-none text-muted-foreground">
                        Você gastou {foodSpending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em alimentação este mês.
                    </div>
                </CardFooter>
            </Card>
            </div>
        </div>
    );
}
