import api from '../api/axios';
import { Card, Comment } from '../store/types';
import { API_ENDPOINTS } from '../config';
import { logger } from '../utils/logger';

interface CreateCardData {
    title: string;
    description?: string;
    position: number;
    list_id: number;
}

interface UpdateCardData {
    title?: string;
    description?: string;
    card_color?: string;
    list_id?: number;
    assignee_id?: number | null;
}


export const cardService = {
    async getListCards(listId: number): Promise<Card[]> {
        const response = await api.get<Card[]>(API_ENDPOINTS.CARDS.LIST(listId));
        return response.data;
    },

    async createCard(listId: number, data: CreateCardData): Promise<Card> {
        const response = await api.post<Card>(API_ENDPOINTS.CARDS.CREATE, {
            ...data,
            list_id: listId
        });
        return response.data;
    },

    async updateCard(cardId: number, data: UpdateCardData): Promise<Card> {
        logger.log(`Updating card ${cardId} with data:`, data);
        const response = await api.put<Card>(API_ENDPOINTS.CARDS.UPDATE(cardId), data);
        logger.log(`Card update response:`, response.data);
        return response.data;
    },

    async deleteCard(cardId: number): Promise<void> {
        await api.delete(API_ENDPOINTS.CARDS.DELETE(cardId));
    },

    async moveCard(cardId: number, targetListId: number, newPosition: number): Promise<Card> {
        const response = await api.post<Card>(
            API_ENDPOINTS.CARDS.MOVE(cardId),
            {
                target_list_id: targetListId,
                new_position: newPosition
            }
        );
        return response.data;
    },

    // Comments API
    async getCardComments(cardId: number): Promise<Comment[]> {
        const response = await api.get<Comment[]>(API_ENDPOINTS.CARDS.COMMENTS.LIST(cardId));
        return response.data;
    },

    async createComment(cardId: number, text: string): Promise<Comment> {
        const response = await api.post<Comment>(
            API_ENDPOINTS.CARDS.COMMENTS.CREATE(cardId),
            {
                text,
                card_id: cardId
            }
        );
        return response.data;
    },

    async updateComment(cardId: number, commentId: number, text: string): Promise<Comment> {
        const response = await api.put<Comment>(
            API_ENDPOINTS.CARDS.COMMENTS.UPDATE(cardId, commentId),
            { text }
        );
        return response.data;
    },

    async deleteComment(cardId: number, commentId: number): Promise<void> {
        await api.delete(API_ENDPOINTS.CARDS.COMMENTS.DELETE(cardId, commentId));
    }
};
