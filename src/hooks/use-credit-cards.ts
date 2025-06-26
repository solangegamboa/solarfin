"use client";

import { useContext } from 'react';
import { CreditCardsContext } from '@/contexts/credit-cards-context';

export const useCreditCards = () => {
  const context = useContext(CreditCardsContext);
  if (context === undefined) {
    throw new Error('useCreditCards must be used within a CreditCardsProvider');
  }
  return context;
};
