"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Star, CreditCardIcon } from "lucide-react";

import { useCreditCards } from "@/hooks/use-credit-cards";
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

const cardSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  closingDay: z.coerce.number().min(1, "O dia deve ser maior que 0.").max(31, "Deve ser um dia do mês válido."),
  dueDay: z.coerce.number().min(1, "O dia deve ser maior que 0.").max(31, "Deve ser um dia do mês válido."),
});

type CardFormValues = z.infer<typeof cardSchema>;

const defaultFormValues: CardFormValues = {
    name: "",
    // We use `any` here to allow empty strings in the form, 
    // which z.coerce will handle during validation.
    closingDay: '' as any, 
    dueDay: '' as any,
};

export default function CreditCardsPage() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  const { cards, addCard, deleteCard, setDefaultCard, loading } = useCreditCards();
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
  
  const handleDelete = async () => {
    if (!cardToDelete) return;
    try {
        await deleteCard(cardToDelete);
        toast({ title: "Cartão Excluído" });
        setCardToDelete(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Excluir" });
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
        await setDefaultCard(cardId);
        toast({ title: "Cartão Padrão Atualizado" });
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar" });
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Cartão de Crédito</CardTitle>
            <CardDescription>Cadastre seus cartões de crédito.</CardDescription>
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
                <div key={card.id} className="flex items-center justify-between rounded-lg border p-4">
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
                    <Button variant="ghost" size="icon" onClick={() => handleSetDefault(card.id)} disabled={card.isDefault}>
                        <Star className={`h-5 w-5 ${card.isDefault ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCardToDelete(card.id)}>
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
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
