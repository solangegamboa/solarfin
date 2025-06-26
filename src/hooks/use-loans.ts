"use client";

import { useContext } from 'react';
import { LoansContext } from '@/contexts/loans-context';

export const useLoans = () => {
  const context = useContext(LoansContext);
  if (context === undefined) {
    throw new Error('useLoans must be used within a LoansProvider');
  }
  return context;
};
