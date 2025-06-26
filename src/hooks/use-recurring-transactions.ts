"use client";

import { useContext } from 'react';
import { RecurringTransactionsContext } from '@/contexts/recurring-transactions-context';

export const useRecurringTransactions = () => {
  const context = useContext(RecurringTransactionsContext);
  if (context === undefined) {
    throw new Error('useRecurringTransactions must be used within a RecurringTransactionsProvider');
  }
  return context;
};
