import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function RecurringPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão de Despesas Recorrentes</CardTitle>
        <CardDescription>Adicione despesas recorrentes para gerar automaticamente previsões de despesas futuras por até 6 meses.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Gerencie suas despesas fixas como aluguel, assinaturas e serviços públicos. A SolarFin usará essas informações para prever seus gastos para os próximos 6 meses, ajudando você a orçar de forma eficaz.</p>
      </CardContent>
    </Card>
  );
}
