"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Landmark, CalendarIcon } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useLoans } from "@/hooks/use-loans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";

const loanSchema = z.object({
  institutionName: z.string().min(2, "O nome da instituição é obrigatório."),
  installmentAmount: z.coerce.number().min(0.01, "O valor da parcela deve ser maior que zero."),
  totalInstallments: z.coerce.number().min(1, "O número de parcelas deve ser pelo menos 1."),
  contractDate: z.date({ required_error: "A data de contratação é obrigatória." }),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export default function LoansPage() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

  const { loans, addLoan, deleteLoan, loading } = useLoans();
  const { toast } = useToast();

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      institutionName: "",
      installmentAmount: "" as any,
      totalInstallments: "" as any,
      contractDate: new Date(),
    },
  });

  const onSubmit = async (data: LoanFormValues) => {
    setIsSaving(true);
    try {
      await addLoan(data);
      toast({ title: "Empréstimo Adicionado", description: "Seu novo empréstimo foi salvo." });
      form.reset({
        institutionName: "",
        installmentAmount: "" as any,
        totalInstallments: "" as any,
        contractDate: new Date(),
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to save loan:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o empréstimo." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;
    try {
      await deleteLoan(loanToDelete);
      toast({ title: "Empréstimo Excluído" });
      setLoanToDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Excluir" });
    }
  };
  
  const calculatePaidInstallments = (contractDate: Date) => {
    const monthsPassed = differenceInMonths(new Date(), new Date(contractDate));
    return monthsPassed < 0 ? 0 : monthsPassed + 1;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Empréstimos</CardTitle>
            <CardDescription>Cadastre e acompanhe seus empréstimos.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Novo Empréstimo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Empréstimo</DialogTitle>
                <DialogDescription>Preencha os detalhes do seu empréstimo.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="institutionName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Instituição</FormLabel>
                      <FormControl><Input placeholder="Ex: Banco do Brasil" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="installmentAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Parcela</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 500,00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalInstallments" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total de Parcelas</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 24" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contractDate" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Data de Contratação</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Salvando..." : "Salvar Empréstimo"}
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
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </>
            ) : loans.length > 0 ? (
              loans.map((loan) => {
                const paidInstallments = calculatePaidInstallments(loan.contractDate);
                const progress = Math.min((paidInstallments / loan.totalInstallments) * 100, 100);

                return (
                    <div key={loan.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Landmark className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">{loan.institutionName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {loan.installmentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / mês
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setLoanToDelete(loan.id)}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>Progresso</span>
                                <span>Parcela {Math.min(paidInstallments, loan.totalInstallments)} de {loan.totalInstallments}</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    </div>
                )
              })
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Nenhum empréstimo cadastrado.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!loanToDelete} onOpenChange={(open) => !open && setLoanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o empréstimo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoanToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
