import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle de Despesas</CardTitle>
        <CardDescription>Categorize as despesas para acompanhar seus hábitos de consumo de forma eficaz.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>É aqui que você gerenciará e acompanhará todas as suas despesas. A funcionalidade para adicionar, editar e categorizar despesas será implementada aqui.</p>
      </CardContent>
    </Card>
  );
}
