import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CreditCardsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Cartão de Crédito</CardTitle>
        <CardDescription>Registre e gerencie compras no cartão de crédito com parcelamento.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Esta seção permitirá que você gerencie suas compras no cartão de crédito, especialmente aquelas com parcelamento. Você poderá rastrear pagamentos, juros e datas de vencimento.</p>
      </CardContent>
    </Card>
  );
}
