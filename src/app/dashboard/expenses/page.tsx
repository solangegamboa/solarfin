import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Tracking</CardTitle>
        <CardDescription>Categorize expenses to track your spending habits effectively.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is where you will manage and track all your expenses. Functionality to add, edit, and categorize expenses will be implemented here.</p>
      </CardContent>
    </Card>
  );
}
