
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Star, CreditCardIcon } from "lucide-react";
import { addMonths, isSameMonth, isAfter, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useCreditCards } from "@/hooks/use-credit-cards";
import type { CreditCard } from "@/contexts/credit-cards-context";
import { useTransactions } from "@/contexts/transactions-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const cardSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  closingDay: z.coerce.number().min(1, "O dia deve ser maior que 0.").max(31, "Deve ser um dia do mês válido."),
  dueDay: z.coerce.number().min(1, "O dia deve ser maior que 0.").max(31, "Deve ser um dia do mês válido."),
});

type CardFormValues = z.infer<typeof cardSchema>;

const defaultFormValues: CardFormValues = {
    name: "",
    closingDay: '' as any, 
    dueDay: '' as any,
};

interface BillEntry {
  description: string;
  date: Date;
  installment: string;
  amount: number;
}

interface FutureInstallmentEntry {
  description: string;
  billDate: Date;
  installment: string;
  amount: number;
}


export default function CreditCardsPage() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  
  const { cards, addCard, deleteCard, setDefaultCard, loading } = useCreditCards();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { toast } = useToast();

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: CardFormValues) => {
    setIsSaving(true);
    try {
      await addCard(data);
      toast({ title: "Cartão Adicionado", description: "Seu novo cartão de crédito foi salvo." });
      form.reset(defaultFormValues);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save card:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o cartão." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    try {
        await deleteCard(cardToDelete);
        toast({ title: "Cartão Excluído" });
        setCardToDelete(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Excluir" });
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    try {
        await setDefaultCard(cardId);
        toast({ title: "Cartão Padrão Atualizado" });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar" });
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    setCardToDelete(cardId);
  }

  const { currentBill, futureInstallments, billTotal, dueDate } = useMemo(() => {
    if (!selectedCard) return { currentBill: [], futureInstallments: [], billTotal: 0, dueDate: '' };

    const cardTransactions = transactions.filter(
      (t) => t.paymentMethod === 'credit_card' && t.creditCardId === selectedCard.id
    );

    const bill: BillEntry[] = [];
    const future: FutureInstallmentEntry[] = [];
    const today = new Date();

    cardTransactions.forEach((purchase) => {
        if (!purchase.installments || purchase.installments === 0) return;

        const installmentAmount = purchase.amount / purchase.installments;
        const purchaseDate = new Date(purchase.date);
        
        const firstBillMonthOffset = purchaseDate.getDate() > selectedCard.closingDay ? 1 : 0;
        
        for (let i = 0; i < purchase.installments; i++) {
            const installmentNumber = i + 1;
            const installmentBillDate = addMonths(purchaseDate, firstBillMonthOffset + i);

            if (isSameMonth(installmentBillDate, today)) {
                bill.push({
                    description: purchase.description,
                    date: purchaseDate,
                    installment: `${installmentNumber}/${purchase.installments}`,
                    amount: installmentAmount,
                });
            } 
            else if (isAfter(installmentBillDate, today)) {
                future.push({
                    description: purchase.description,
                    billDate: installmentBillDate,
                    installment: `${installmentNumber}/${purchase.installments}`,
                    amount: installmentAmount,
                });
            }
        }
    });
    
    const calculatedBillTotal = bill.reduce((acc, item) => acc + item.amount, 0);

    future.sort((a, b) => a.billDate.getTime() - b.billDate.getTime());

    const closingDate = new Date(today.getFullYear(), today.getMonth(), selectedCard.closingDay);
    let due = new Date(closingDate.getFullYear(), closingDate.getMonth(), selectedCard.dueDay);
    if (selectedCard.dueDay <= selectedCard.closingDay) {
        due = addMonths(due, 1);
    }
    const formattedDueDate = format(due, "dd 'de' MMMM", { locale: ptBR });

    return { currentBill: bill, futureInstallments: future, billTotal: calculatedBillTotal, dueDate: formattedDueDate };

  }, [selectedCard, transactions]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Cartão de Crédito</CardTitle>
            <CardDescription>Cadastre seus cartões de crédito. Clique em um cartão para ver os detalhes.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Novo Cartão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cartão</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do seu cartão de crédito.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cartão</FormLabel>
                      <FormControl><Input placeholder="Ex: Nubank, Inter" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="closingDay" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia do Fechamento</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 25" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="dueDay" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia do Vencimento</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Salvando..." : "Salvar Cartão"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </>
            ) : cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.id} onClick={() => setSelectedCard(card)} className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{card.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Fecha dia {card.closingDay} &bull; Vence dia {card.dueDay}
                        </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => handleSetDefault(e, card.id)} disabled={card.isDefault}>
                        <Star className={`h-5 w-5 ${card.isDefault ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDeleteClick(e, card.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Nenhum cartão de crédito cadastrado.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!cardToDelete} onOpenChange={(open) => !open && setCardToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cartão.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCardToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
          {selectedCard && (
            <>
            <SheetHeader className="p-6 border-b">
                <SheetTitle>Detalhes do Cartão: {selectedCard.name}</SheetTitle>
                <SheetDescription>
                    Fatura atual com vencimento em {dueDate} no valor de <span className="font-semibold text-foreground">{billTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>.
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Fatura Atual ({format(new Date(), "MMMM", { locale: ptBR })})</h3>
                    <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                              <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Data da Compra</TableHead>
                              <TableHead className="text-center">Parcela</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {transactionsLoading ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell></TableRow> :
                              currentBill.length > 0 ? (
                              currentBill.map((item, index) => (
                                  <TableRow key={index}>
                                  <TableCell className="font-medium">{item.description}</TableCell>
                                  <TableCell>{format(item.date, "dd/MM/yyyy")}</TableCell>
                                  <TableCell className="text-center"><Badge variant="outline">{item.installment}</Badge></TableCell>
                                  <TableCell className="text-right">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                  </TableRow>
                              ))
                              ) : (
                              <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma despesa na fatura atual.</TableCell></TableRow>
                              )}
                          </TableBody>
                        </Table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Próximas Parcelas</h3>
                    <div className="rounded-lg border">
                      <Table>
                          <TableHeader>
                              <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Fatura de</TableHead>
                              <TableHead className="text-center">Parcela</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                               {transactionsLoading ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell></TableRow> :
                              futureInstallments.length > 0 ? (
                              futureInstallments.map((item, index) => (
                                  <TableRow key={index}>
                                  <TableCell className="font-medium">{item.description}</TableCell>
                                  <TableCell>{format(item.billDate, "MMMM/yy", {locale: ptBR})}</TableCell>
                                  <TableCell className="text-center"><Badge variant="outline">{item.installment}</Badge></TableCell>
                                  <TableCell className="text-right">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                  </TableRow>
                              ))
                              ) : (
                              <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma parcela futura.</TableCell></TableRow>
                              )}
                          </TableBody>
                      </Table>
                    </div>
                  </div>
              </div>
            </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
