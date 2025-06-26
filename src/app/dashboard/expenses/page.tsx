"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/contexts/transactions-context";
import type { Transaction } from "@/contexts/transactions-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readReceipt } from "@/ai/flows/read-receipt-flow";

const transactionSchema = z.object({
  description: z.string().min(2, { message: "A descrição deve ter pelo menos 2 caracteres." }),
  amount: z.coerce.number().min(0.01, { message: "O valor deve ser maior que zero." }),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  category: z.string().min(2, { message: "A categoria deve ter pelo menos 2 caracteres." }),
  type: z.enum(["entrada", "saida"], {
    required_error: "Você precisa selecionar um tipo de transação.",
  }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const { transactions, addTransaction, deleteTransaction, loading } = useTransactions();
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
        description: "",
        amount: 0,
        date: new Date(),
        category: "",
        type: "saida",
    }
  });

  const onSubmit = async (data: TransactionFormValues) => {
    setIsSaving(true);
    try {
      await addTransaction(data);
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
      });
      setActiveTab("manual");
      setOpen(false);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a transação. Tente novamente.",
      });
    } finally {
        setIsSaving(false);
    }
  };

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Transações</CardTitle>
                <CardDescription>
                Gerencie suas transações de entrada e saída.
                </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    form.reset({
                        description: "",
                        amount: 0,
                        date: new Date(),
                        category: "",
                        type: "saida",
                    });
                    setActiveTab("manual");
                }
            }}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Nova Transação
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Adicionar Nova Transação</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes manualmente ou envie um cupom fiscal.
                    </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="manual">Manual</TabsTrigger>
                                    <TabsTrigger value="receipt">Cupom Fiscal</TabsTrigger>
                                </TabsList>
                                <TabsContent value="manual" className="space-y-4 pt-4">
                                    <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                        <FormLabel>Tipo de Transação</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex space-x-4"
                                            >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                <RadioGroupItem value="entrada" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Entrada</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                <RadioGroupItem value="saida" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Saída</FormLabel>
                                            </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />

                                    <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Salário, Aluguel" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />

                                    <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Valor</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />

                                    <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Renda, Moradia" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Data da Transação</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    >
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: ptBR })
                                                    ) : (
                                                        <span>Escolha uma data</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                    locale={ptBR}
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </TabsContent>
                                <TabsContent value="receipt">
                                    <div className="flex flex-col items-center justify-center space-y-4 pt-8 pb-4">
                                        <Upload className="h-12 w-12 text-muted-foreground" />
                                        <p className="text-center text-sm text-muted-foreground">
                                            Envie uma imagem do seu cupom fiscal e nós preencheremos o valor para você.
                                        </p>
                                        <Button asChild disabled={isAnalyzing} className="cursor-pointer">
                                            <label htmlFor="receipt-upload">
                                                {isAnalyzing ? "Analisando..." : "Enviar Imagem"}
                                            </label>
                                        </Button>
                                        <Input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isAnalyzing} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <DialogFooter>
                                <Button type="submit" disabled={isSaving || isAnalyzing}>
                                    {isSaving ? "Salvando..." : "Salvar Transação"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && !isSaving ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Carregando transações...
                            </TableCell>
                        </TableRow>
                    ) : transactions.length > 0 ? (
                        transactions.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{t.category}</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>
                                <Badge variant={t.type === 'entrada' ? 'default' : 'secondary'}>
                                    {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                                </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'saida' ? '-' : ''}
                                {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setTransactionToDelete(t)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Nenhuma transação encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação <span className="font-semibold">"{transactionToDelete?.description}"</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? "Excluindo..." : "Confirmar"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
