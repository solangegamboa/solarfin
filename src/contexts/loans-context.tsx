'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
    getLoansFromFirestore, 
    addLoanToFirestore, 
    deleteLoanFromFirestore,
} from '@/services/loans-service';

export type Loan = {
    id: string;
    institutionName: string;
    installmentAmount: number;
    totalInstallments: number;
    contractDate: Date;
    userId: string;
}

interface LoansContextType {
    loans: Loan[];
    addLoan: (loan: Omit<Loan, 'id' | 'userId'>) => Promise<void>;
    deleteLoan: (loanId: string) => Promise<void>;
    loading: boolean;
}

export const LoansContext = createContext<LoansContextType | undefined>(undefined);

export const LoansProvider = ({ children }: { children: ReactNode }) => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchLoans = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const userLoans = await getLoansFromFirestore(user.uid);
                setLoans(userLoans);
            } catch (error) {
                console.error("Failed to fetch loans:", error);
                setLoans([]);
            } finally {
                setLoading(false);
            }
        } else {
            setLoans([]);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLoans();
    }, [user, fetchLoans]);

    const addLoan = useCallback(async (loanData: Omit<Loan, 'id' | 'userId'>) => {
        if (!user) throw new Error('Usuário não autenticado.');
        await addLoanToFirestore(loanData, user.uid);
        await fetchLoans(); // Refetch to update the UI
    }, [user, fetchLoans]);

    const deleteLoan = useCallback(async (loanId: string) => {
        if (!user) throw new Error('Usuário não autenticado.');
        await deleteLoanFromFirestore(loanId);
        await fetchLoans(); // Refetch to update the UI
    }, [user, fetchLoans]);
    
    const value = useMemo(() => ({
        loans,
        addLoan,
        deleteLoan,
        loading,
    }), [loans, loading, addLoan, deleteLoan]);

    return (
        <LoansContext.Provider value={value}>
            {children}
        </LoansContext.Provider>
    );
};
