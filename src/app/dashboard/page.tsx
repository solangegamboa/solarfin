"use client";

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
import { ArrowUpRight, DollarSign, CreditCard, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import Link from "next/link";


const transactions = [
    { type: 'Supermercado', category: 'Alimentação', amount: -75.42, date: '2024-05-20' },
    { type: 'Salário', category: 'Renda', amount: 3000.00, date: '2024-05-20' },
    { type: 'Netflix', category: 'Lazer', amount: -15.99, date: '2024-05-19' },
    { type: 'Gasolina', category: 'Transporte', amount: -45.10, date: '2024-05-18' },
    { type: 'Jantar Fora', category: 'Alimentação', amount: -120.00, date: '2024-05-17' },
]

const chartData = [
  { category: "Alimentação", value: 400, fill: "var(--color-food)" },
  { category: "Moradia", value: 1200, fill: "var(--color-housing)" },
  { category: "Transporte", value: 250, fill: "var(--color-transport)" },
  { category: "Lazer", value: 150, fill: "var(--color-entertainment)" },
  { category: "Outros", value: 300, fill: "var(--color-other)" },
]

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
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo Atual</CardDescription>
              <CardTitle className="text-4xl">R$5.329</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+25% do último mês</div>
            </CardContent>
            <CardFooter>
              <Progress value={25} aria-label="Aumento de 25%" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gastos deste Mês</CardDescription>
              <CardTitle className="text-4xl">R$1.329</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+10% do último mês</div>
            </CardContent>
            <CardFooter>
              <Progress value={10} aria-label="Aumento de 10%" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contas a Vencer</CardDescription>
              <CardTitle className="text-4xl">R$250,75</CardTitle>
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
                    Você gastou R$400 em alimentação este mês.
                </div>
            </CardFooter>
          </Card>
        </div>
      </div>
  );
}
