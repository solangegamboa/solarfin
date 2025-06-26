'use client';

import React, { createContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
    RecurringTransaction,
    getRecurringTransactionsFromFirestore, 
    addRecurringTransactionToFirestore, 
    deleteRecurringTransactionFromFirestore 
} from '@/services/recurring-transactions-service';

type RecurringTransactionData = Omit<RecurringTransaction, 'id' | 'userId'>;

interface RecurringTransactionsContextType {
    recurringTransactions: RecurringTransaction[];
    addRecurringTransaction: (transaction: RecurringTransactionData) => Promise<void>;
    deleteRecurringTransaction: (transactionId: string) => Promise<void>;
    loading: boolean;
}

export const RecurringTransactionsContext = createContext<RecurringTransactionsContextType | undefined>(undefined);

export const RecurringTransactionsProvider = ({ children }: { children: ReactNode }) => {
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchRecurringTransactions = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const userRecurringTransactions = await getRecurringTransactionsFromFirestore(user.uid);
                setRecurringTransactions(userRecurringTransactions);
            } catch (error) {
                console.error("Failed to fetch recurring transactions:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setRecurringTransactions([]);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRecurringTransactions();
    }, [user, fetchRecurringTransactions]);

    const addRecurringTransaction = useCallback(async (transaction: RecurringTransactionData) => {
        if (!user) throw new Error('Usuário não autenticado.');
        await addRecurringTransactionToFirestore(transaction, user.uid);
        await fetchRecurringTransactions();
    }, [user, fetchRecurringTransactions]);

    const deleteRecurringTransaction = useCallback(async (transactionId: string) => {
        if (!user) throw new Error('Usuário não autenticado.');
        await deleteRecurringTransactionFromFirestore(transactionId);
        await fetchRecurringTransactions();
    }, [user, fetchRecurringTransactions]);
    
    const value = useMemo(() => ({
        recurringTransactions,
        addRecurringTransaction,
        deleteRecurringTransaction,
        loading,
    }), [recurringTransactions, loading, addRecurringTransaction, deleteRecurringTransaction]);

    return (
        <RecurringTransactionsContext.Provider value={value}>
            {children}
        </RecurringTransactionsContext.Provider>
    );
};
