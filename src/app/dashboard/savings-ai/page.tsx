import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SavingsAIPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Savings Suggestions</CardTitle>
        <CardDescription>A financial planning tool providing personalized savings suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Based on an analysis of your income and spending data, our generative AI will provide personalized suggestions on how to optimize your savings, manage debt, and make smart investments.</p>
      </CardContent>
    </Card>
  );
}
