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
    { type: 'Groceries', category: 'Food', amount: -75.42, date: '2024-05-20' },
    { type: 'Salary', category: 'Income', amount: 3000.00, date: '2024-05-20' },
    { type: 'Netflix', category: 'Entertainment', amount: -15.99, date: '2024-05-19' },
    { type: 'Gas', category: 'Transport', amount: -45.10, date: '2024-05-18' },
    { type: 'Dinner Out', category: 'Food', amount: -120.00, date: '2024-05-17' },
]

const chartData = [
  { category: "Food", value: 400, fill: "var(--color-food)" },
  { category: "Housing", value: 1200, fill: "var(--color-housing)" },
  { category: "Transport", value: 250, fill: "var(--color-transport)" },
  { category: "Entertainment", value: 150, fill: "var(--color-entertainment)" },
  { category: "Other", value: 300, fill: "var(--color-other)" },
]

const chartConfig = {
  value: {
    label: "Value",
  },
  food: {
    label: "Food",
    color: "hsl(var(--chart-1))",
  },
  housing: {
    label: "Housing",
    color: "hsl(var(--chart-2))",
  },
  transport: {
    label: "Transport",
    color: "hsl(var(--chart-3))",
  },
  entertainment: {
    label: "Entertainment",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
}

export default function DashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Balance</CardDescription>
              <CardTitle className="text-4xl">$5,329</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+25% from last month</div>
            </CardContent>
            <CardFooter>
              <Progress value={25} aria-label="25% increase" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Month's Spending</CardDescription>
              <CardTitle className="text-4xl">$1,329</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+10% from last month</div>
            </CardContent>
            <CardFooter>
              <Progress value={10} aria-label="10% increase" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming Bills</CardDescription>
              <CardTitle className="text-4xl">$250.75</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">3 bills due this week</div>
            </CardContent>
             <CardFooter>
              <Button size="sm" asChild>
                <Link href="/dashboard/recurring">View Bills</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>AI Suggestion</CardDescription>
              <CardTitle className="text-lg">Save on Groceries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">You can save up to $50/month.</div>
            </CardContent>
            <CardFooter>
               <Button size="sm" asChild>
                <Link href="/dashboard/savings-ai">Learn More</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>A list of your most recent transactions.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
                        {t.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex justify-end">
               <Button asChild>
                 <Link href="/dashboard/expenses">View All Transactions <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
               </Button>
            </CardFooter>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Your spending distribution for this month.</CardDescription>
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
                    Top Category: Food
                </div>
                <div className="flex w-full items-center gap-2 leading-none text-muted-foreground">
                    You've spent $400 on food this month.
                </div>
            </CardFooter>
          </Card>
        </div>
      </div>
  );
}
