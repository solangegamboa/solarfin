import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function RecurringPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Expense Forecast</CardTitle>
        <CardDescription>Add recurring expenses to automatically generate future expense forecasts for up to 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Manage your fixed expenses like rent, subscriptions, and utilities. SolarFin will use this information to predict your spending for the next 6 months, helping you budget effectively.</p>
      </CardContent>
    </Card>
  );
}
