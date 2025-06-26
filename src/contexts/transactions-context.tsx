'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

export type Transaction = {
    id: string;
    description: string;
    amount: number;
    date: Date;
    type: 'entrada' | 'saida';
    category: string;
}

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const initialTransactions: Transaction[] = [
    // Current Month
    { id: '1', description: 'Salário', amount: 5000, date: new Date(currentYear, currentMonth, 5), type: 'entrada', category: 'Renda' },
    { id: '2', description: 'Compras no Supermercado', amount: 350.75, date: new Date(currentYear, currentMonth, 10), type: 'saida', category: 'Alimentação' },
    { id: '3', description: 'Conta de Luz', amount: 120.00, date: new Date(currentYear, currentMonth, 15), type: 'saida', category: 'Moradia' },
    { id: '4', description: 'Gasolina', amount: 150.00, date: new Date(currentYear, currentMonth, 3), type: 'saida', category: 'Transporte' },
    { id: '5', description: 'Cinema', amount: 60.00, date: new Date(currentYear, currentMonth, 12), type: 'saida', category: 'Lazer' },

    // Last Month
    { id: '6', description: 'Salário', amount: 5000, date: new Date(currentYear, currentMonth - 1, 5), type: 'entrada', category: 'Renda' },
    { id: '7', description: 'Aluguel', amount: 1500, date: new Date(currentYear, currentMonth - 1, 1), type: 'saida', category: 'Moradia' },
    { id: '8', description: 'Internet', amount: 99.90, date: new Date(currentYear, currentMonth - 1, 10), type: 'saida', category: 'Moradia' },
    { id: '9', description: 'Venda de item usado', amount: 200, date: new Date(currentYear, currentMonth - 1, 20), type: 'entrada', category: 'Outros' },
];


interface TransactionsContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = {
            id: (transactions.length + 1).toString(),
            ...transaction
        };
        setTransactions(prev => [newTransaction, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
    };

    const value = useMemo(() => ({
        transactions,
        addTransaction
    }), [transactions]);

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    );
};

export const useTransactions = () => {
    const context = useContext(TransactionsContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionsProvider');
    }
    return context;
};
