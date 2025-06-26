'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
    getCreditCardsFromFirestore, 
    addCreditCardToFirestore, 
    deleteCreditCardFromFirestore,
    setDefaultCreditCardInFirestore
} from '@/services/credit-cards-service';

export type CreditCard = {
    id: string;
    name: string;
    closingDay: number;
    dueDay: number;
    isDefault: boolean;
    userId: string;
}

interface CreditCardsContextType {
    cards: CreditCard[];
    addCard: (card: Omit<CreditCard, 'id' | 'userId' | 'isDefault'>) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    setDefaultCard: (cardId: string) => Promise<void>;
    loading: boolean;
}

export const CreditCardsContext = createContext<CreditCardsContextType | undefined>(undefined);

export const CreditCardsProvider = ({ children }: { children: ReactNode }) => {
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchCards = useCallback(async () => {
        if (user) {
            setLoading(true);
            const userCards = await getCreditCardsFromFirestore(user.uid);
            setCards(userCards);
            setLoading(false);
        } else {
            setCards([]);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCards();
    }, [user, fetchCards]);

    const addCard = useCallback(async (cardData: Omit<CreditCard, 'id' | 'userId' | 'isDefault'>) => {
        if (!user) throw new Error('Usuário não autenticado.');
        
        const isDefault = cards.length === 0;
        const newCardData = { ...cardData, isDefault, userId: user.uid };

        const newCard = await addCreditCardToFirestore(newCardData, user.uid);
        
        if (isDefault) {
            await setDefaultCreditCardInFirestore(newCard.id, [newCard]);
        }
        await fetchCards();
    }, [user, cards, fetchCards]);

    const deleteCard = useCallback(async (cardId: string) => {
        if (!user) throw new Error('Usuário não autenticado.');
        await deleteCreditCardFromFirestore(cardId);
        await fetchCards();
    }, [user, fetchCards]);

    const setDefaultCard = useCallback(async (cardId: string) => {
        if (!user) throw new Error('Usuário não autenticado.');
        await setDefaultCreditCardInFirestore(cardId, cards);
        await fetchCards();
    }, [user, cards, fetchCards]);
    
    const value = useMemo(() => ({
        cards,
        addCard,
        deleteCard,
        setDefaultCard,
        loading,
    }), [cards, loading, addCard, deleteCard, setDefaultCard]);

    return (
        <CreditCardsContext.Provider value={value}>
            {children}
        </CreditCardsContext.Provider>
    );
};
