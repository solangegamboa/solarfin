
"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/contexts/transactions-context";
import { useCreditCards } from "@/hooks/use-credit-cards";
import type { Transaction } from "@/contexts/transactions-context";
import { AddTransactionButton } from "@/components/add-transaction-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { transactions, deleteTransaction, loading } = useTransactions();
  const { cards } = useCreditCards();
  const { toast } = useToast();

  const categories = useMemo(() => {
    const allCategories = transactions.map(t => t.category);
    const uniqueCategories = [...new Set(allCategories)].filter(Boolean);
    return uniqueCategories.map(category => ({
      value: category,
      label: category
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const monthMatch = isSameMonth(new Date(t.date), currentMonth);
      if (!monthMatch) return false;

      const descriptionMatch = descriptionFilter ? t.description.toLowerCase().includes(descriptionFilter.toLowerCase()) : true;
      const categoryMatch = categoryFilter ? t.category.toLowerCase() === categoryFilter.toLowerCase() : true;
      
      let paymentMethodMatch = true;
      if (paymentMethodFilter !== 'all') {
          if (paymentMethodFilter === 'money') {
            paymentMethodMatch = t.paymentMethod === 'money' || !t.paymentMethod;
          } else {
            paymentMethodMatch = t.paymentMethod === paymentMethodFilter;
          }
      }
      
      return descriptionMatch && categoryMatch && paymentMethodMatch;
    });
  }, [transactions, descriptionFilter, categoryFilter, paymentMethodFilter, currentMonth]);

  const filteredMonthTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'saida')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);


  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
        await deleteTransaction(transactionToDelete.id);
        toast({
            title: "Transação Excluída",
            description: `Sua transação "${transactionToDelete.description}" foi excluída.`,
        });
        setTransactionToDelete(null);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível excluir a transação. Tente novamente.",
        });
    } finally {
        setIsDeleting(false);
    }
  };

  const getCardName = (cardId: string | undefined) => cards.find(c => c.id === cardId)?.name || 'N/A';

  const formattedDate = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Transações</CardTitle>
                <CardDescription>Gerencie e filtre suas transações de entrada e saída.</CardDescription>
            </div>
            <AddTransactionButton />
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 lg:col-span-1">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Mês Anterior</span></Button>
                <h2 className="text-lg font-semibold whitespace-nowrap text-center flex-1">{capitalizedDate}</h2>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8"><ChevronRight className="h-4 w-4" /><span className="sr-only">Próximo Mês</span></Button>
              </div>
              <Input
                placeholder="Filtrar por descrição..."
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                className="lg:col-span-1"
              />
              <div className="lg:col-span-1">
                <Combobox
                    options={categories}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    placeholder="Filtrar por categoria..."
                    searchPlaceholder="Buscar categoria..."
                    emptyMessage="Nenhuma categoria encontrada."
                />
              </div>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="lg:col-span-1">
                  <SelectValue placeholder="Tipo de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Pagamentos</SelectItem>
                  <SelectItem value="money">Dinheiro/Débito</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-[100px] text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando transações...</TableCell></TableRow>
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.description}</TableCell>
                                <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                                <TableCell>{format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                <TableCell>
                                    {t.paymentMethod === 'credit_card' ? (
                                        <Badge variant="outline" className="gap-1.5"><CreditCard className="h-3 w-3"/> {getCardName(t.creditCardId)} {t.installments && t.installments > 1 ? `(${t.installments}x)`: ''}</Badge>
                                    ) : (
                                        <Badge variant={t.type === 'entrada' ? 'default' : 'secondary'}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${t.type === 'entrada' ? 'text-primary' : 'text-destructive'}`}>
                                    {t.type === 'saida' ? '-' : ''}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => setTransactionToDelete(t)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada com os filtros atuais.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map(t => (
                        <div key={t.id} className="rounded-lg border p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <span className="font-medium pr-2 break-all">{t.description}</span>
                                <span className={`font-medium whitespace-nowrap ${t.type === 'entrada' ? 'text-primary' : 'text-destructive'}`}>
                                    {t.type === 'saida' ? '-' : ''}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span><Badge variant="outline">{t.category}</Badge></span>
                                <span>{format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                {t.paymentMethod === 'credit_card' ? (
                                    <Badge variant="outline" className="gap-1.5"><CreditCard className="h-3 w-3"/> {getCardName(t.creditCardId)} {t.installments && t.installments > 1 ? `(${t.installments}x)`: ''}</Badge>
                                ) : (
                                    <Badge variant={t.type === 'entrada' ? 'default' : 'secondary'}>{t.type === 'entrada' ? 'Entrada' : 'Saída'}</Badge>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => setTransactionToDelete(t)} disabled={isDeleting} className="h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Nenhuma transação encontrada com os filtros atuais.</p>
                    </div>
                )}
            </div>

        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
            <div className="text-right text-lg">
                <span className="text-muted-foreground font-normal text-base">Gasto Total ({format(currentMonth, "MMMM", { locale: ptBR })}): </span>
                <span className="font-semibold text-destructive ml-2">
                    -{filteredMonthTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
        </CardFooter>
      </Card>
      
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação <span className="font-semibold">"{transactionToDelete?.description}"</span>.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>{isDeleting ? "Excluindo..." : "Confirmar"}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
