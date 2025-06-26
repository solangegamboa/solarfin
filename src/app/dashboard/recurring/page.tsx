"use client";

import { useState } from "react";
import { DollarSign, Trash2, Calendar, CreditCard } from "lucide-react";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { RecurringTransaction } from "@/services/recurring-transactions-service";
import { Badge } from "@/components/ui/badge";

export default function RecurringPage() {
  const [itemToDelete, setItemToDelete] = useState<RecurringTransaction | null>(null);
  const { recurringTransactions, deleteRecurringTransaction, loading } = useRecurringTransactions();
  const { cards } = useCreditCards();
  const { toast } = useToast();

  const getCardName = (cardId: string | undefined) => {
    return cards.find(c => c.id === cardId)?.name || 'N/A';
  }

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteRecurringTransaction(itemToDelete.id);
      toast({ title: "Despesa Recorrente Excluída" });
      setItemToDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Excluir" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Despesas Recorrentes</CardTitle>
          <CardDescription>
            Gerencie suas despesas fixas como aluguel e assinaturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </>
            ) : recurringTransactions.length > 0 ? (
              recurringTransactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-md">
                        {item.paymentMethod === 'credit_card' ? <CreditCard className="h-6 w-6 text-muted-foreground" /> : <DollarSign className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-semibold">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="gap-1.5">
                            <Calendar className="h-3 w-3" />
                            Todo dia {item.dayOfMonth}
                        </Badge>
                        {item.paymentMethod === 'credit_card' && (
                            <Badge variant="secondary" className="gap-1.5">
                                <CreditCard className="h-3 w-3" />
                                {getCardName(item.creditCardId)}
                            </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item)}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Nenhuma despesa recorrente cadastrada.</p>
                <p className="text-sm">Você pode salvar uma despesa como recorrente ao adicioná-la.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a despesa recorrente
              <span className="font-semibold"> "{itemToDelete?.description}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
