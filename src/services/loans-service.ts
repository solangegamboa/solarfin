'use client';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Loan } from '@/contexts/loans-context';

type FirestoreLoan = Omit<Loan, 'id' | 'contractDate'> & {
    contractDate: Timestamp;
    userId: string;
};

export const addLoanToFirestore = async (loan: Omit<Loan, 'id' | 'userId'>, userId: string): Promise<Loan> => {
    if (!userId) throw new Error("O usuário não está autenticado.");

    const firestoreLoan: FirestoreLoan = {
        ...loan,
        contractDate: Timestamp.fromDate(loan.contractDate),
        userId,
    };

    const docRef = await addDoc(collection(db, 'loans'), firestoreLoan);
    return { ...loan, id: docRef.id, userId };
};

export const getLoansFromFirestore = async (userId: string): Promise<Loan[]> => {
    if (!userId) return [];
    
    const q = query(collection(db, 'loans'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const loans: Loan[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        loans.push({
            id: doc.id,
            institutionName: data.institutionName,
            installmentAmount: data.installmentAmount,
            totalInstallments: data.totalInstallments,
            contractDate: (data.contractDate as Timestamp).toDate(),
            userId: data.userId,
        });
    });
    return loans.sort((a, b) => new Date(a.contractDate).getTime() - new Date(b.contractDate).getTime());
};

export const deleteLoanFromFirestore = async (loanId: string): Promise<void> => {
    if (!loanId) throw new Error("ID do empréstimo não fornecido.");
    const loanRef = doc(db, 'loans', loanId);
    await deleteDoc(loanRef);
};
