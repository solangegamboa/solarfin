'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTransactionsFromFirestore, addTransactionToFirestore } from '@/services/transactions-service';

export type Transaction = {
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: 'entrada' | 'saida';
    category: string;
}

interface TransactionsContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    loading: boolean;
}

export const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchTransactions = async () => {
            if (user) {
                setLoading(true);
                const userTransactions = await getTransactionsFromFirestore(user.uid);
                setTransactions(userTransactions);
                setLoading(false);
            } else if (!user) {
                setTransactions([]);
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user]);

    const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
        if (!user) {
            throw new Error('Usuário não autenticado para adicionar transação');
        }
        setLoading(true);
        const newTransaction = await addTransactionToFirestore(transaction, user.uid);
        // Add new transaction to the beginning of the list and re-sort
        setTransactions(prev => [newTransaction, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
        setLoading(false);
    }, [user]);
    
    const value = useMemo(() => ({
        transactions,
        addTransaction,
        loading,
    }), [transactions, loading, addTransaction]);

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    );
};

export const useTransactions = () => {
    const context = useContext(TransactionsContext);
    if (context === undefined) {
        throw new Error('useTransactions deve ser usado dentro de um TransactionsProvider');
    }
    return context;
};
