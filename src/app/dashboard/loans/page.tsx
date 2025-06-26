import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LoansPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Management</CardTitle>
        <CardDescription>Input and manage loan details, track payment schedules, and monitor outstanding balances.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Here you can input details for any loans you have, such as mortgages, car loans, or personal loans. The system will help you track payment schedules and remaining balances.</p>
      </CardContent>
    </Card>
  );
}
