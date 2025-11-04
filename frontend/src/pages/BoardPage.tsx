import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { RootState, AppDispatch } from '../store';
import { fetchBoard, setCurrentBoard, updateBoard } from '../store/board.slice';
import { Board, Card } from '../store/types';
import { listService } from '../services/list.service';
import { cardService } from '../services/card.service';
import { logger } from '../utils/logger';
import {
  Button,
  Input,
  ErrorMessage,
  PageContainer,
  Modal
} from '../components/ui';
import BoardSettingsForm from '../components/board/BoardSettingsForm';
import CardModal from '../components/card/CardModal';
import ShareBoardModal from '../components/board/ShareBoardModal';

// Список предустановленных цветов для списков
const listColors = [
  { name: 'Indigo', value: 'from-indigo-600 to-indigo-500' },
  { name: 'Purple', value: 'from-purple-600 to-indigo-500' },
  { name: 'Blue', value: 'from-blue-600 to-indigo-600' },
  { name: 'Green', value: 'from-green-500 to-teal-600' },
  { name: 'Red', value: 'from-red-500 to-pink-600' },
  { name: 'Orange', value: 'from-orange-500 to-amber-600' },
];

// New components for the board page
const ListCard: React.FC<{
  id: number;
  title: string;
  children: React.ReactNode;
  onAddCard: () => void;
  dragHandleProps?: any;
  listColor?: string;
  onEditColor?: () => void;
}> = ({ title, children, onAddCard, dragHandleProps, listColor, onEditColor }) => {
  // Определяем цвет градиента, используя собственный цвет списка или дефолтный
  const gradientClass = listColor || 'from-indigo-600 to-indigo-500';

  // Определяем класс тени в зависимости от основного цвета
  let shadowClass = 'shadow-md';
  if (listColor) {
    if (listColor.includes('blue') || listColor.includes('indigo')) {
      shadowClass = 'shadow-blue-100';
    } else if (listColor.includes('green') || listColor.includes('teal') || listColor.includes('emerald')) {
      shadowClass = 'shadow-green-100';
    } else if (listColor.includes('purple') || listColor.includes('violet')) {
      shadowClass = 'shadow-purple-100';
    } else if (listColor.includes('red') || listColor.includes('pink') || listColor.includes('rose')) {
      shadowClass = 'shadow-red-100';
    } else if (listColor.includes('orange') || listColor.includes('amber') || listColor.includes('yellow')) {
      shadowClass = 'shadow-orange-100';
    } else if (listColor.includes('gray')) {
      shadowClass = 'shadow-gray-200';
    } else if (listColor.includes('cyan') || listColor.includes('sky')) {
      shadowClass = 'shadow-blue-100';
    }
  }

  return (
    <div className={`w-80 flex-shrink-0 bg-gray-100 rounded-lg ${shadowClass} border border-gray-200 overflow-hidden`}>
    <div
      {...dragHandleProps}
        className={`p-3 font-semibold bg-gradient-to-r ${gradientClass} text-white rounded-t-lg flex justify-between items-center transition-colors duration-300`}
    >
      <span>{title}</span>
        <button
          onClick={onEditColor}
          className="text-white opacity-80 hover:opacity-100 p-1 rounded hover:bg-white/10"
          title="Изменить цвет списка"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>
    </div>
    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
      {children}
    </div>
    <div className="p-3 bg-gray-50 border-t border-gray-200">
        <button
        onClick={onAddCard}
          className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition duration-150 ease-in-out"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add a card
        </button>
      </div>
  </div>
);
};

const TaskCard: React.FC<{
  id: number;
  title: string;
  description?: string;
  dragHandleProps?: any;
  onClick: () => void;
  card_id?: number;
  created_at?: string;
  card_color?: string;
  formatted_id?: string;
  assignee?: any;
}> = ({ title, description, dragHandleProps, onClick, card_id, created_at, card_color, formatted_id, assignee }) => {
  // Форматируем дату создания, если она есть
  const formattedDate = created_at ? new Date(created_at).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }) : '';

  // Используем один цвет по умолчанию для всех карточек
  const defaultColor = 'from-indigo-600 to-indigo-500';

  // Determine the color - if card_color is a Tailwind color class, use it directly
  // Otherwise, create a custom background color style
  let colorStyle = {};
  let colorClass = 'bg-gradient-to-r';

  if (card_color) {
    // If it's a hex color, use it as a background style
    if (card_color.startsWith('#')) {
      colorStyle = { backgroundColor: card_color };
      colorClass = '';  // No gradient for custom colors
    } else {
      // Must be a Tailwind class
      colorClass = `bg-gradient-to-r ${card_color}`;
    }
  } else {
    // Default gradient
    colorClass = `bg-gradient-to-r ${defaultColor}`;
  }

  return (
    <div
      className="bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Тонкая цветная полоса сверху */}
      <div
        className={`h-1 ${colorClass}`}
        style={colorStyle}
      ></div>

    <div
      {...dragHandleProps}
        className="p-3 relative"
      >
        {/* Декоративный фоновый элемент */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-800">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
          </svg>
        </div>

      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800">{title}</h4>
          <span className="text-xs font-mono bg-blue-100 text-blue-800 rounded px-2 py-1">
            {formatted_id || `${card_id}`}
          </span>
      </div>

      {description && (
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
            {formattedDate ? `Создано ${formattedDate}` : 'Создано'}
        </span>
        <div className="flex space-x-1">
          {description && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
          )}

          {/* Show assignee if exists */}
          {assignee && (
            <span className="inline-flex items-center bg-indigo-50 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full ml-2">
              <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-1 font-bold">
                {assignee.username.substring(0, 1).toUpperCase()}
              </span>
              <span className="truncate max-w-[60px]">{assignee.username}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

const AddItemForm: React.FC<{
  placeholder: string;
  onSubmit: (e: React.FormEvent) => void;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
}> = ({ placeholder, onSubmit, value, onChange, onCancel }) => (
  <form onSubmit={onSubmit} className="p-2">
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
    />
    <div className="mt-2 flex space-x-2">
      <Button type="submit" className="w-auto">
        Add
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} className="w-auto">
        Cancel
      </Button>
    </div>
  </form>
);

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentBoard, isLoading, error } = useSelector((state: RootState) => state.board);

  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);

  // Добавляем новые состояния для управления модальным окном настроек
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isSavingSettings] = useState(false);

  // Избегаем повторной загрузки
  const boardLoadedRef = useRef(false);

  // Add new state variables for card modal
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedListTitle, setSelectedListTitle] = useState<string>('');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [selectedListColor, setSelectedListColor] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (!boardId || boardLoadedRef.current) return;

    const loadBoard = async () => {
      // Очищаем весь кеш при загрузке доски
      // clearAllCardsCache();

      try {
    if (boardId) {
          const parsedBoardId = parseInt(boardId);

          try {
            // Загружаем доску с карточками (backend уже возвращает cards в составе lists)
            const boardResult = await dispatch(fetchBoard(parsedBoardId)).unwrap();

            if (!boardResult || !Array.isArray(boardResult.lists)) {
              logger.error("Invalid board data received:", boardResult);
              return;
            }

            // Карточки уже включены в boardResult.lists[].cards, просто устанавливаем доску
            dispatch(setCurrentBoard(boardResult));
          } catch (error) {
            logger.error('Error loading board data:', error);
          }
        }
      } catch (error) {
        logger.error('Error processing board ID:', error);
      }
    };

    loadBoard();
    boardLoadedRef.current = true;

    // Сбрасываем флаг при размонтировании или изменении ID доски
    return () => {
      boardLoadedRef.current = false;
    };
  }, [dispatch, boardId]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading board...</div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage message={error} />
      </PageContainer>
    );
  }

  if (!currentBoard) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Board not found</div>
        </div>
      </PageContainer>
    );
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !currentBoard) return;

    try {
      const response = await listService.createList(currentBoard.id, {
        title: newListTitle,
        position: currentBoard.lists.length,
        board_id: currentBoard.id
      });

      const newList = {
        ...response,
        cards: []
      };

      // Очищаем кеш доски
      // clearBoardCache(currentBoard.id);
      // Очищаем кеш карточек
      // clearAllCardsCache();

      const updatedBoard: Board = {
        ...currentBoard,
        lists: [...currentBoard.lists, newList]
      };
      dispatch(setCurrentBoard(updatedBoard));
      setNewListTitle('');
      setIsAddingList(false);
    } catch (err) {
      logger.error('Failed to create list', err);
    }
  };

  const handleCreateCard = async (listId: number) => {
    if (!newCardTitle.trim() || !currentBoard) return;

    try {
      const list = currentBoard.lists.find(l => l.id === listId);
      if (!list) return;

      const response = await cardService.createCard(listId, {
        title: newCardTitle,
        position: list.cards.length,
        list_id: listId
      });

      // Очищаем кэш для этого списка
      // cardsCache.delete(listId);
      // Очищаем кеш доски
      // clearBoardCache(currentBoard.id);

      const updatedBoard: Board = {
        ...currentBoard,
        lists: currentBoard.lists.map(list =>
          list.id === listId
            ? { ...list, cards: [...list.cards, response] }
            : list
        )
      };
      dispatch(setCurrentBoard(updatedBoard));
      setNewCardTitle('');
      setAddingCardToList(null);
    } catch (err) {
      logger.error('Failed to create card', err);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;

    // Если нет места назначения, ничего не делаем
    if (!destination) {
      return;
    }

    // Если исходный и целевой индексы совпадают, ничего не делаем
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Проверяем, что currentBoard существует
    if (!currentBoard || !Array.isArray(currentBoard.lists)) {
      logger.error("Cannot handle drag end - board or lists are undefined");
      return;
    }

    // Если перетаскивается список
    if (type === 'LIST') {
      try {
        // Получаем списки и перемещаемый список
        const lists = [...currentBoard.lists];

        if (!Array.isArray(lists)) {
          logger.error("Lists array is not valid");
          return;
        }

        // Получаем список, который перемещаем
        const movedList = lists[source.index];

        if (!movedList) {
          logger.error("Moved list is undefined");
          return;
        }

        // Удаляем список из исходной позиции
        lists.splice(source.index, 1);

        // Вставляем список в новую позицию
        lists.splice(destination.index, 0, movedList);

        // Обновляем позиции
      const updatedLists = lists.map((list, index) => ({
        ...list,
        position: index
      }));

        // Создаем обновленную доску
      const updatedBoard: Board = {
        ...currentBoard,
        lists: updatedLists
      };

      // Обновляем локальное состояние
      dispatch(setCurrentBoard(updatedBoard));

        // Отправляем запрос на сервер для обновления позиции списка
        try {
          await listService.reorderList(movedList.id, destination.index);
          // Очищаем весь кеш после перетаскивания списков
          // clearAllCardsCache();
          // Очищаем кеш доски
          // clearBoardCache(currentBoard.id);
      } catch (err) {
        logger.error('Failed to update list position', err);
        // Если была ошибка, загружаем актуальное состояние с сервера
        dispatch(fetchBoard(currentBoard.id));
      }
      } catch (error) {
        logger.error("Error handling list drag:", error);
      }
    }

    // Если перетаскивается карточка
    if (type === 'CARD') {
      try {
      // Извлекаем ID списков из droppableId
        const sourceListIdMatch = source.droppableId.match(/list-(\d+)/);
        const destListIdMatch = destination.droppableId.match(/list-(\d+)/);

        if (!sourceListIdMatch || !destListIdMatch) {
          logger.error("Invalid list ID format in droppable IDs");
          return;
        }

        const sourceListId = parseInt(sourceListIdMatch[1]);
        const destListId = parseInt(destListIdMatch[1]);

        if (isNaN(sourceListId) || isNaN(destListId)) {
          logger.error("Invalid list IDs:", sourceListId, destListId);
          return;
        }

        // Находим исходный и целевой списки
        const sourceList = currentBoard.lists.find(list => list.id === sourceListId);
        const destList = currentBoard.lists.find(list => list.id === destListId);

        if (!sourceList || !destList) {
          logger.error("Source or destination list not found");
          return;
        }

        // Получаем ID карточки из draggableId
        let cardId: number;

        // Поддерживаем оба формата ID: либо "card-123", либо просто "123"
        if (draggableId.startsWith('card-')) {
          cardId = parseInt(draggableId.replace('card-', ''));
        } else {
          cardId = parseInt(draggableId);
        }

        if (isNaN(cardId)) {
          logger.error("Invalid card ID:", draggableId);
          return;
        }

        // Находим карточку, которую перемещаем
        const movedCard = sourceList.cards.find(card => card.id === cardId);

        if (!movedCard) {
          logger.error("Moved card not found");
          return;
        }

        // Копируем массивы карточек, чтобы не изменять оригинальные
        const sourceCards = Array.isArray(sourceList.cards) ? [...sourceList.cards] : [];
        const destCards = Array.isArray(destList.cards) ? [...destList.cards] : [];

        // Если перемещение в пределах одного списка
        if (sourceListId === destListId) {
          // Удаляем карточку из исходной позиции
          sourceCards.splice(source.index, 1);

          // Вставляем карточку в новую позицию
          sourceCards.splice(destination.index, 0, movedCard);

          // Обновляем позиции
        const updatedCards = sourceCards.map((card, index) => ({
          ...card,
          position: index
        }));

        // Создаем обновленную доску
        const updatedBoard: Board = {
          ...currentBoard,
            lists: Array.isArray(currentBoard.lists) ? currentBoard.lists.map(list =>
            list.id === sourceListId
              ? { ...list, cards: updatedCards }
              : list
            ) : []
        };

        // Обновляем локальное состояние
        dispatch(setCurrentBoard(updatedBoard));
      } else {
          // Если перемещение между списками

          // Удаляем карточку из исходного списка
          sourceCards.splice(source.index, 1);

          // Вставляем карточку в целевой список
          destCards.splice(destination.index, 0, { ...movedCard, list_id: destListId });

          // Обновляем позиции в обоих списках
        const updatedSourceCards = sourceCards.map((card, index) => ({
          ...card,
          position: index
        }));

        const updatedDestCards = destCards.map((card, index) => ({
          ...card,
          position: index,
          list_id: destListId
        }));

        // Создаем обновленную доску
        const updatedBoard: Board = {
          ...currentBoard,
            lists: Array.isArray(currentBoard.lists) ? currentBoard.lists.map(list => {
            if (list.id === sourceListId) {
              return { ...list, cards: updatedSourceCards };
            }
            if (list.id === destListId) {
              return { ...list, cards: updatedDestCards };
            }
            return list;
            }) : []
        };

        // Обновляем локальное состояние
        dispatch(setCurrentBoard(updatedBoard));
      }

      try {
          logger.log(`Moving card ${cardId} to list ${destListId} at position ${destination.index}`);
        // Отправляем запрос на сервер
        await cardService.moveCard(
            cardId,
          destListId,
          destination.index
        );

          // Очищаем кеш для затронутых списков
          // clearListCardsCache(sourceListId);
          if (sourceListId !== destListId) {
            // clearListCardsCache(destListId);
          }

          // Очищаем кеш доски
          // clearBoardCache(currentBoard.id);
      } catch (err) {
        logger.error('Failed to update card position', err);
        // Если была ошибка, загружаем актуальное состояние с сервера
        dispatch(fetchBoard(currentBoard.id));
      }
      } catch (error) {
        logger.error("Error handling card drag:", error);
      }
    }
  };

  // Добавляем функцию для обновления настроек доски
  const handleSaveSettings = async (updatedSettings: { title: string; description?: string; background_color?: string }) => {
    if (!boardId) return;

    try {
      await dispatch(updateBoard({ id: Number(boardId), data: updatedSettings })).unwrap();
      setSettingsModalOpen(false);
    } catch (error) {
      logger.error('Failed to update board settings:', error);
    }
  };

  // Add a function to handle card click
  const handleCardClick = (card: Card, listTitle: string) => {
    setSelectedCard(card);
    setSelectedListTitle(listTitle);
    setIsCardModalOpen(true);
  };

  // Add a function to handle card update
  const handleUpdateCard = async (updatedCard: Partial<Card>) => {
    if (!selectedCard) return;

    try {
      logger.log('Updating card with data:', JSON.stringify(updatedCard, null, 2));

      // Make sure we're sending all required fields
      const cardData = {
        title: updatedCard.title,
        description: updatedCard.description,
        card_color: updatedCard.card_color,
        list_id: updatedCard.list_id || selectedCard.list_id, // Include list_id
        assignee_id: updatedCard.assignee_id
      };

      logger.log('Sending to API:', JSON.stringify(cardData, null, 2));

      // Обновляем карточку на сервере
      const response = await cardService.updateCard(selectedCard.id, cardData);
      logger.log('API response:', JSON.stringify(response, null, 2));

      // Если запрос успешен, обновляем карточку в стейте
      if (currentBoard) {
        const updatedLists = currentBoard.lists.map(list => {
          if (list.id === response.list_id) {
            return {
              ...list,
              cards: list.cards.map(card =>
                card.id === response.id ? { ...card, ...response } : card
              )
            };
          }
          return list;
        });

        dispatch(setCurrentBoard({
          ...currentBoard,
          lists: updatedLists
        }));

        // Обновляем выбранную карточку
        setSelectedCard(response);
      }
    } catch (error) {
      logger.error('Failed to update card:', error);
    }
  };

  // Функция для открытия модального окна редактирования цвета списка
  const handleListColorEdit = (listId: number, currentColor?: string) => {
    setEditingListId(listId);
    setSelectedListColor(currentColor || listColors[0].value);
  };

  // Функция для сохранения цвета списка
  const handleListColorSave = async () => {
    if (editingListId === null || !currentBoard) return;

    try {
      // Находим список по ID
      const listToUpdate = currentBoard.lists.find(list => list.id === editingListId);
      if (!listToUpdate) {
        logger.error('List not found:', editingListId);
        return;
      }

      // Обновляем список на сервере
      await listService.updateList(editingListId, {
        list_color: selectedListColor
      });

      // Обновляем локальный стейт
      const updatedLists = currentBoard.lists.map(list =>
        list.id === editingListId ? { ...list, list_color: selectedListColor } : list
      );

      dispatch(setCurrentBoard({
        ...currentBoard,
        lists: updatedLists
      }));

      // Закрываем модальное окно
      setEditingListId(null);
    } catch (error) {
      logger.error('Failed to update list color:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${currentBoard?.background_color || 'from-indigo-600 to-indigo-500'} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start mb-4 sm:mb-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 mr-3 sm:mr-4 shadow-lg border border-white/10 hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="w-full">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {currentBoard?.title || 'Loading board...'}
                </h1>
                {currentBoard?.description && (
                  <div className="mt-2 bg-black/10 rounded-md p-2 text-sm text-white/90 max-w-full sm:max-w-2xl backdrop-blur-sm border border-white/10 max-h-[100px] overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                    }}>
                    {currentBoard.description}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-white bg-white/10 backdrop-blur-sm shadow-md hover:bg-white/20
                          border border-white/20 transition-all font-medium flex items-center"
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}
                onClick={() => setSettingsModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                className="text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-white bg-white/10 backdrop-blur-sm shadow-md hover:bg-white/20
                          border border-white/20 transition-all font-medium flex items-center"
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}
                onClick={() => setShareModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                className="text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-white bg-white/10 backdrop-blur-sm shadow-md hover:bg-white/20
                          border border-white/20 transition-all font-medium flex items-center"
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}
                onClick={() => navigate('/home')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </button>

              <div className="text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-white bg-white/10 backdrop-blur-sm shadow-md
                          border border-white/20 font-medium flex items-center"
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}>
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="mr-1">{currentBoard?.lists?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно настроек доски */}
      {currentBoard && (
        <Modal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          title="Board Settings"
          size="medium"
        >
          <BoardSettingsForm
            board={currentBoard}
            onSave={handleSaveSettings}
            onCancel={() => setSettingsModalOpen(false)}
            isSubmitting={isSavingSettings}
          />
        </Modal>
      )}

      {/* Add CardModal component */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={selectedCard}
        listTitle={selectedListTitle}
        onSave={handleUpdateCard}
        boardId={currentBoard?.id || 0}
        boardTitle={currentBoard?.title || ''}
      />

      {/* Модальное окно для редактирования цвета списка */}
      <Modal
        isOpen={editingListId !== null}
        onClose={() => setEditingListId(null)}
        title="Изменить цвет списка"
        size="small"
      >
        <div className="p-4">
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2">
              {listColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-12 rounded-md cursor-pointer bg-gradient-to-r ${color.value} flex items-center justify-center ${
                    selectedListColor === color.value ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-90'
                  }`}
                  onClick={() => setSelectedListColor(color.value)}
                >
                  {selectedListColor === color.value && (
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setEditingListId(null)}
            >
              Отмена
            </Button>
            <Button onClick={handleListColorSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно для шаринга доски */}
      {currentBoard && (
        <ShareBoardModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          boardId={currentBoard.id}
        />
      )}

      {!currentBoard || !Array.isArray(currentBoard.lists) ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading board data...</div>
        </div>
      ) : (
      <main className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="LIST">
            {(provided: DroppableProvided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-4 overflow-x-auto pb-4"
              >
                  {Array.isArray(currentBoard.lists) && currentBoard.lists.map((list, index) => (
                  <Draggable
                    key={list.id}
                    draggableId={`list-${list.id}`}
                    index={index}
                  >
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <ListCard
                            id={list.id}
                            title={list.title || 'Untitled List'}
                          dragHandleProps={provided.dragHandleProps}
                          onAddCard={() => setAddingCardToList(list.id)}
                            listColor={list.list_color}
                            onEditColor={() => handleListColorEdit(list.id, list.list_color)}
                        >
                          <Droppable droppableId={`list-${list.id}`} type="CARD">
                            {(provided: DroppableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                  className="space-y-2 min-h-[80px]"
                              >
                                  {Array.isArray(list.cards) && list.cards.length > 0 ? (
                                    list.cards.map((card, cardIndex) => (
                                  <Draggable
                                        key={String(card.id)}
                                        draggableId={String(card.id)}
                                        index={cardIndex}
                                  >
                                    {(provided: DraggableProvided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                      >
                                        <TaskCard
                                          id={card.id}
                                          title={card.title}
                                          card_id={card.card_id}
                                          description={card.description}
                                          dragHandleProps={provided.dragHandleProps}
                                              onClick={() => handleCardClick(card, list.title)}
                                              created_at={card.created_at}
                                              card_color={card.card_color}
                                              formatted_id={card.formatted_id}
                                              assignee={card.assignee}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                    ))
                                  ) : (
                                    <div className="p-3 text-gray-400 text-sm h-20 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md bg-gray-50">
                                      Перетащите карточку сюда
                                    </div>
                                  )}
                                {provided.placeholder}

                                {addingCardToList === list.id && (
                                  <AddItemForm
                                    placeholder="Enter card title"
                                    value={newCardTitle}
                                    onChange={setNewCardTitle}
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleCreateCard(list.id);
                                    }}
                                    onCancel={() => {
                                      setAddingCardToList(null);
                                      setNewCardTitle('');
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </Droppable>
                        </ListCard>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                  {isAddingList ? (
                    <div className="w-80 flex-shrink-0">
                      <AddItemForm
                        placeholder="Enter list title"
                        value={newListTitle}
                        onChange={setNewListTitle}
                        onSubmit={handleCreateList}
                        onCancel={() => {
                          setIsAddingList(false);
                          setNewListTitle('');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-80 flex-shrink-0">
                    <Button
                      onClick={() => setIsAddingList(true)}
                        className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 rounded-lg shadow-sm"
                    >
                        + Add a list
                    </Button>
                    </div>
                  )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
      )}
    </div>
  );
};

export default BoardPage;
