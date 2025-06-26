"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/contexts/transactions-context";
import { useCreditCards } from "@/hooks/use-credit-cards";
import type { Transaction } from "@/contexts/transactions-context";
import { AddTransactionButton } from "@/components/add-transaction-button";

export default function TransactionsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const { transactions, deleteTransaction, loading } = useTransactions();
  const { cards } = useCreditCards();
  const { toast } = useToast();

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
                <CardDescription>Gerencie suas transações de entrada e saída.</CardDescription>
            </div>
            <AddTransactionButton />
        </CardHeader>
        <CardContent>
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
                    ) : transactions.length > 0 ? (
                        transactions.map((t) => (
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
                            <TableCell className={`text-right font-medium ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'saida' ? '-' : ''}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => setTransactionToDelete(t)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
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
