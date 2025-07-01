
"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, CreditCard } from "lucide-react";

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

export default function TransactionsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  
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
  }, [transactions, descriptionFilter, categoryFilter, paymentMethodFilter]);

  const filteredMonthTotal = useMemo(() => {
    const today = new Date();
    return filteredTransactions
      .filter(t => t.type === 'saida' && isSameMonth(new Date(t.date), today))
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
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                placeholder="Filtrar por descrição..."
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                className="max-w-sm"
              />
              <div className="max-w-sm w-full">
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
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Tipo de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Pagamentos</SelectItem>
                  <SelectItem value="money">Dinheiro/Débito</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                                    <Badge variant="secondary" className="gap-1.5"><CreditCard className="h-3 w-3"/> {getCardName(t.creditCardId)} {t.installments && t.installments > 1 ? `(${t.installments}x)`: ''}</Badge>
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
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
            <div className="text-lg font-semibold">
                Gasto Total (Mês Atual, Filtrado):
                <span className="text-destructive ml-2">
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
