'use client';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import type { CreditCard } from '@/contexts/credit-cards-context';

export const addCreditCardToFirestore = async (card: Omit<CreditCard, 'id'>, userId: string): Promise<CreditCard> => {
    if (!userId) throw new Error("O usuário não está autenticado.");

    const docRef = await addDoc(collection(db, 'creditCards'), { ...card, userId });

    return { ...card, id: docRef.id };
};

export const getCreditCardsFromFirestore = async (userId: string): Promise<CreditCard[]> => {
    if (!userId) return [];
    
    const q = query(collection(db, 'creditCards'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const cards: CreditCard[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        cards.push({
            id: doc.id,
            name: data.name,
            closingDay: data.closingDay,
            dueDay: data.dueDay,
            isDefault: data.isDefault,
            userId: data.userId,
        });
    });
    return cards;
};

export const deleteCreditCardFromFirestore = async (cardId: string): Promise<void> => {
    if (!cardId) throw new Error("ID do cartão não fornecido.");
    const cardRef = doc(db, 'creditCards', cardId);
    await deleteDoc(cardRef);
};

export const setDefaultCreditCardInFirestore = async (cardIdToSetDefault: string, allUserCards: CreditCard[]): Promise<void> => {
    const batch = writeBatch(db);

    allUserCards.forEach(card => {
        const cardRef = doc(db, 'creditCards', card.id);
        batch.update(cardRef, { isDefault: card.id === cardIdToSetDefault });
    });

    await batch.commit();
};
