'use client';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';

export type RecurringTransaction = {
    id: string;
    userId: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: 'money' | 'credit_card';
    creditCardId?: string;
    dayOfMonth: number;
};

type RecurringTransactionData = Omit<RecurringTransaction, 'id' | 'userId'>

export const addRecurringTransactionToFirestore = async (recurringTransaction: RecurringTransactionData, userId: string): Promise<RecurringTransaction> => {
    if (!userId) throw new Error("O usuário não está autenticado.");

    const docRef = await addDoc(collection(db, 'recurringTransactions'), {
        ...recurringTransaction,
        userId,
    });

    return { ...recurringTransaction, id: docRef.id, userId };
};

export const getRecurringTransactionsFromFirestore = async (userId: string): Promise<RecurringTransaction[]> => {
    if (!userId) return [];
    
    const q = query(collection(db, 'recurringTransactions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const transactions: RecurringTransaction[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
            id: doc.id,
            description: data.description,
            amount: data.amount,
            category: data.category,
            paymentMethod: data.paymentMethod,
            creditCardId: data.creditCardId,
            dayOfMonth: data.dayOfMonth,
            userId: data.userId,
        });
    });
    return transactions.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
};

export const deleteRecurringTransactionFromFirestore = async (id: string): Promise<void> => {
    if (!id) throw new Error("ID da transação recorrente não fornecido.");
    const recurringTransactionRef = doc(db, 'recurringTransactions', id);
    await deleteDoc(recurringTransactionRef);
};
