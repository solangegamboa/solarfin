'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTransactionsFromFirestore, addTransactionToFirestore, deleteTransactionFromFirestore } from '@/services/transactions-service';

export type Transaction = {
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: 'entrada' | 'saida';
    category: string;
    paymentMethod?: 'money' | 'credit_card';
    creditCardId?: string;
    installments?: number;
}

interface TransactionsContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    deleteTransaction: (transactionId: string) => Promise<void>;
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
        setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    }, [user]);

    const deleteTransaction = useCallback(async (transactionId: string) => {
        if (!user) {
            throw new Error('Usuário não autenticado para deletar transação');
        }
        await deleteTransactionFromFirestore(transactionId);
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    }, [user]);
    
    const value = useMemo(() => ({
        transactions,
        addTransaction,
        deleteTransaction,
        loading,
    }), [transactions, loading, addTransaction, deleteTransaction]);

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
