import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoansPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Empréstimos</CardTitle>
        <CardDescription>Insira e gerencie detalhes de empréstimos, acompanhe cronogramas de pagamento e monitore saldos devedores.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode inserir detalhes de quaisquer empréstimos que possua, como hipotecas, financiamentos de veículos ou empréstimos pessoais. O sistema o ajudará a acompanhar os cronogramas de pagamento e os saldos remanescentes.</p>
      </CardContent>
    </Card>
  );
}
