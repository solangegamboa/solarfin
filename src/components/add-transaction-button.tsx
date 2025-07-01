"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTransactions, type Transaction } from "@/contexts/transactions-context";
import { useCreditCards } from "@/hooks/use-credit-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readReceipt } from "@/ai/flows/read-receipt-flow";
import { Switch } from "@/components/ui/switch";
import { useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import type { RecurringTransaction } from "@/services/recurring-transactions-service";


const transactionSchema = z.object({
  description: z.string().min(2, "A descrição é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  date: z.date({ required_error: "A data é obrigatória." }),
  category: z.string().min(2, "A categoria é obrigatória."),
  type: z.enum(["entrada", "saida"]),
  paymentMethod: z.enum(["money", "credit_card"]),
  creditCardId: z.string().optional(),
  installments: z.coerce.number().optional(),
  saveAsRecurring: z.boolean().default(false),
}).refine((data) => {
    if (data.paymentMethod === 'credit_card') {
        return !!data.creditCardId && !!data.installments && data.installments > 0;
    }
    return true;
}, {
    message: "Para cartão de crédito, selecione o cartão e o número de parcelas.",
    path: ["creditCardId"], 
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function AddTransactionButton() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  
  const { addTransaction } = useTransactions();
  const { addRecurringTransaction } = useRecurringTransactions();
  const { cards, loading: cardsLoading } = useCreditCards();
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
        description: "",
        amount: 0,
        date: new Date(),
        category: "",
        type: "saida",
        paymentMethod: "money",
        installments: 1,
        saveAsRecurring: false,
    }
  });

  const paymentMethod = form.watch("paymentMethod");
  const transactionType = form.watch("type");
  const saveAsRecurring = form.watch("saveAsRecurring");

  useEffect(() => {
    if (paymentMethod === 'credit_card') {
      form.setValue('type', 'saida');
      const defaultCard = cards.find(c => c.isDefault);
      if (defaultCard) {
        form.setValue('creditCardId', defaultCard.id);
      }
    } else {
        form.setValue('type', 'saida');
    }
  }, [paymentMethod, form, cards]);

  useEffect(() => {
    if (saveAsRecurring) {
        form.setValue('installments', 1);
    }
  }, [saveAsRecurring, form]);


  const onSubmit = async (data: TransactionFormValues) => {
    setIsSaving(true);
    try {
      // For recurring expenses, the amount is the monthly charge (the installment value).
      if (data.saveAsRecurring && data.type === 'saida') {
        const recurringPayload: Omit<RecurringTransaction, 'id' | 'userId'> = {
          description: data.description,
          amount: data.amount,
          category: data.category,
          paymentMethod: data.paymentMethod,
          dayOfMonth: data.date.getDate(),
        };

        if (data.paymentMethod === 'credit_card') {
          recurringPayload.creditCardId = data.creditCardId;
        }

        await addRecurringTransaction(recurringPayload);
      }
      
      // For the transaction itself, the amount is the total purchase value.
      const totalAmount = data.paymentMethod === 'credit_card' && data.installments
          ? data.amount * data.installments
          : data.amount;

      const transactionPayload: Omit<Transaction, 'id'> = {
          description: data.description,
          amount: totalAmount,
          date: data.date,
          category: data.category,
          type: data.type,
          paymentMethod: data.paymentMethod,
      };

      if (data.paymentMethod === 'credit_card') {
          transactionPayload.creditCardId = data.creditCardId;
          transactionPayload.installments = data.installments;
      }

      await addTransaction(transactionPayload);
      
      toast({
        title: "Transação Adicionada",
        description: `Sua transação "${data.description}" foi salva.`,
      });
      form.reset({
        description: "",
        amount: 0,
        date: new Date(),
        category: "",
        type: "saida",
        paymentMethod: "money",
        installments: 1,
        saveAsRecurring: false,
      });
      setActiveTab("manual");
      setOpen(false);
    } catch (error) {
       console.error("Failed to save transaction:", error);
       toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a transação. Tente novamente.",
      });
    } finally {
        setIsSaving(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUri = reader.result as string;
            const result = await readReceipt({ photoDataUri: dataUri });
            
            if (result && result.amount) {
                form.setValue("amount", result.amount);
                toast({
                    title: "Valor Extraído com Sucesso",
                    description: `O valor de ${result.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi preenchido.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Falha ao Ler o Cupom",
                    description: "Não foi possível identificar o valor total no cupom. Por favor, preencha manualmente.",
                });
            }
            form.setValue("type", "saida");
            form.setValue("paymentMethod", "money");
            setActiveTab("manual");
            setIsAnalyzing(false);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("Error reading receipt:", error);
        toast({
            variant: "destructive",
            title: "Erro na Análise",
            description: "Ocorreu um erro ao processar a imagem.",
        });
        setIsAnalyzing(false);
    }
    if (event.target) {
        event.target.value = '';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" /> Nova Transação
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Adicionar Nova Transação</DialogTitle>
                <DialogDescription>Preencha os detalhes manualmente ou envie um cupom fiscal.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual</TabsTrigger>
                            <TabsTrigger value="receipt">Cupom Fiscal</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="space-y-4 pt-4">
                                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Método de Pagamento</FormLabel>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="money" /></FormControl><FormLabel className="font-normal">Dinheiro/Débito</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="credit_card" /></FormControl><FormLabel className="font-normal">Cartão de Crédito</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormItem>
                            )} />
                            
                            {paymentMethod === 'money' && (
                                    <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Tipo de Transação</FormLabel>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4">
                                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="entrada" /></FormControl><FormLabel className="font-normal">Entrada</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="saida" /></FormControl><FormLabel className="font-normal">Saída</FormLabel></FormItem>
                                        </RadioGroup>
                                    </FormItem>
                                )} />
                            )}

                            {paymentMethod === 'credit_card' && (
                                <>
                                    <FormField control={form.control} name="creditCardId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cartão de Crédito</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger disabled={cardsLoading}>
                                                        <SelectValue placeholder="Selecione um cartão" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {cards.map(card => <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="installments" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Parcelas</FormLabel>
                                            <FormControl><Input type="number" placeholder="1" {...field} disabled={saveAsRecurring} /></FormControl>
                                        </FormItem>
                                    )} />
                                </>
                            )}
                            
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Ex: Salário, Aluguel" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>{paymentMethod === 'credit_card' ? 'Valor da Parcela' : 'Valor'}</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input placeholder="Ex: Renda, Moradia" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Data da {paymentMethod === 'credit_card' ? 'Compra' : 'Transação'}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                             {transactionType === "saida" && (
                                <FormField control={form.control} name="saveAsRecurring" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center gap-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Salvar como despesa recorrente</FormLabel>
                                        </div>
                                    </FormItem>
                                )} />
                             )}
                        </TabsContent>
                        <TabsContent value="receipt"><div className="flex flex-col items-center justify-center space-y-4 pt-8 pb-4"><Upload className="h-12 w-12 text-muted-foreground" /><p className="text-center text-sm text-muted-foreground">Envie uma imagem do seu cupom fiscal e nós preencheremos o valor para você.</p><Button asChild disabled={isAnalyzing} className="cursor-pointer"><label htmlFor="receipt-upload">{isAnalyzing ? "Analisando..." : "Enviar Imagem"}</label></Button><Input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isAnalyzing} /></div></TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button type="submit" disabled={isSaving || isAnalyzing || cardsLoading}>
                            {isSaving ? "Salvando..." : "Salvar Transação"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
