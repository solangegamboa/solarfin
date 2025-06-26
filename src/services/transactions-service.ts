
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import type { Transaction } from '@/contexts/transactions-context';

type FirestoreTransaction = Omit<Transaction, 'id' | 'date'> & {
    date: Timestamp;
    userId: string;
};

export const addTransactionToFirestore = async (transaction: Omit<Transaction, 'id'>, userId: string): Promise<Transaction> => {
    if (!userId) throw new Error("O usuário não está autenticado.");

    const firestoreTransaction: FirestoreTransaction = {
        ...transaction,
        date: Timestamp.fromDate(transaction.date),
        userId,
    };

    const docRef = await addDoc(collection(db, 'transactions'), firestoreTransaction);

    return {
        ...transaction,
        id: docRef.id,
    };
};

export const getTransactionsFromFirestore = async (userId: string): Promise<Transaction[]> => {
    if (!userId) return [];
    
    const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
            id: doc.id,
            description: data.description,
            amount: data.amount,
            date: (data.date as Timestamp).toDate(),
            type: data.type,
            category: data.category,
        });
    });

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const deleteTransactionFromFirestore = async (transactionId: string): Promise<void> => {
    if (!transactionId) throw new Error("ID da transação não fornecido.");
    const transactionRef = doc(db, 'transactions', transactionId);
    await deleteDoc(transactionRef);
};
