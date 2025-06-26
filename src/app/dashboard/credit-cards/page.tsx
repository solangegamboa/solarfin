import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CreditCardsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Management</CardTitle>
        <CardDescription>Record and manage credit card purchases with installment plans.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This section will allow you to manage your credit card purchases, especially those with installment plans. You'll be able to track payments, interest, and due dates.</p>
      </CardContent>
    </Card>
  );
}
