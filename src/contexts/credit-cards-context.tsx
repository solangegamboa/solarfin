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
            try {
                const userCards = await getCreditCardsFromFirestore(user.uid);
                setCards(userCards);
            } catch (error) {
                console.error("Failed to fetch credit cards:", error);
                setCards([]);
            } finally {
                setLoading(false);
            }
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
        
        const isTheFirstCard = cards.length === 0;
        const newCardData = { ...cardData, isDefault: isTheFirstCard, userId: user.uid };

        const newCard = await addCreditCardToFirestore(newCardData);
        
        // If it's the first card, we need to ensure it's marked as default in Firestore.
        // The `isDefault` flag is already set on `newCardData`, but `setDefault...` ensures consistency.
        if (isTheFirstCard) {
            await setDefaultCreditCardInFirestore(newCard.id, [newCard]);
        }
        await fetchCards(); // Refetch all cards to update the UI
    }, [user, cards, fetchCards]);

    const deleteCard = useCallback(async (cardId: string) => {
        if (!user) throw new Error('Usuário não autenticado.');
        const cardToDelete = cards.find(c => c.id === cardId);
        
        await deleteCreditCardFromFirestore(cardId);
        
        const remainingCards = cards.filter(c => c.id !== cardId);

        // If the deleted card was the default, make the first remaining card the new default
        if (cardToDelete?.isDefault && remainingCards.length > 0) {
            await setDefaultCreditCardInFirestore(remainingCards[0].id, remainingCards);
        }

        await fetchCards();
    }, [user, fetchCards, cards]);

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
