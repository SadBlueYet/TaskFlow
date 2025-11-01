import api from '../api/axios';
import { Board, BoardShare } from '../store/types';
import { API_ENDPOINTS } from '../config';
import { logger } from '../utils/logger';

interface CreateBoardData {
    title: string;
    description?: string;
    background_color?: string;
}

interface UpdateBoardData {
    title?: string;
    description?: string;
    background_color?: string;
}

interface ShareBoardData {
    board_id: number;
    user_id: number;
    access_type: string;
}

interface UpdateShareData {
    access_type: string;
}

export const boardService = {
    async getBoards(): Promise<Board[]> {
        try {
            const response = await api.get<any[]>(API_ENDPOINTS.BOARDS.LIST);

            if (!Array.isArray(response.data)) {
                logger.error('API response is not an array:', response.data);
                return [];
            }

            const boards = response.data.map(board => ({
                ...board,
                lists: board.lists || []
            }));
            return boards;
        } catch (error) {
            logger.error('Error in getBoards:', error);
            throw error;
        }
    },

    async getBoard(id: number): Promise<Board> {
        const response = await api.get<any>(API_ENDPOINTS.BOARDS.GET(id));

        const board = {
            ...response.data,
            lists: Array.isArray(response.data.lists)
                ? response.data.lists
                    .map((list: any) => ({
                        ...list,
                        cards: list.cards || []
                    }))
                    .sort((a: any, b: any) => a.position - b.position)
                : []
        };

        logger.log('Processed board data:', JSON.stringify(board, null, 2));
        return board;
    },

    async createBoard(data: CreateBoardData): Promise<Board> {
        const response = await api.post<any>(API_ENDPOINTS.BOARDS.CREATE, data);
        return {
            ...response.data,
            lists: []
        };
    },

    async updateBoard(id: number, data: UpdateBoardData): Promise<Board> {
        const response = await api.put<any>(API_ENDPOINTS.BOARDS.UPDATE(id), data);
        return {
            ...response.data,
            lists: response.data.lists || []
        };
    },

    async deleteBoard(id: number): Promise<void> {
        await api.delete(API_ENDPOINTS.BOARDS.DELETE(id));
    },

    // Методы для управления доступом к доскам
    async getBoardShares(boardId: number): Promise<BoardShare[]> {
        try {
            logger.log(`Fetching board shares from: ${API_ENDPOINTS.BOARDS.SHARES.LIST(boardId)}`);
            const response = await api.get<BoardShare[]>(API_ENDPOINTS.BOARDS.SHARES.LIST(boardId));
            logger.log(`Board shares API response:`, response.data);

            // Validate response format
            if (!Array.isArray(response.data)) {
                logger.error('API response is not an array:', response.data);
                return [];
            }

            // Check if each share has the correct format
            const validShares = response.data.filter(share => {
                if (!share || typeof share !== 'object') {
                    logger.error('Invalid share object:', share);
                    return false;
                }

                if (!share.id || !share.user || !share.access_type) {
                    logger.error('Share missing required properties:', share);
                    return false;
                }

                return true;
            });

            return validShares;
        } catch (error) {
            logger.error(`Error fetching board shares for board ${boardId}:`, error);
            throw error;
        }
    },

    async shareBoard(boardId: number, userId: number, accessType: string = 'read'): Promise<BoardShare> {
        const data: ShareBoardData = {
            board_id: boardId,
            user_id: userId,
            access_type: accessType
        };
        const response = await api.post<BoardShare>(API_ENDPOINTS.BOARDS.SHARES.CREATE(boardId), data);
        return response.data;
    },

    async updateBoardShare(boardId: number, userId: number, accessType: string): Promise<BoardShare> {
        const data: UpdateShareData = {
            access_type: accessType
        };
        const response = await api.put<BoardShare>(
            API_ENDPOINTS.BOARDS.SHARES.UPDATE(boardId, userId),
            data
        );
        return response.data;
    },

    async removeBoardShare(boardId: number, userId: number): Promise<void> {
        await api.delete(API_ENDPOINTS.BOARDS.SHARES.DELETE(boardId, userId));
    }
};
