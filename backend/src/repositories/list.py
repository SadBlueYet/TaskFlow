from typing import Sequence
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from src.models import BoardList
from src.models.card import Card
from src.schemas.board import BoardListCreate, BoardListUpdate
from src.schemas.list import ResponseBoardList
from .base import SqlAlchemyRepository

logger = logging.getLogger(__name__)


class ListRepository(SqlAlchemyRepository):
    model: BoardList

    def __init__(self, session: AsyncSession):
        super().__init__(BoardList, session)

    async def get_list(self, list_id: int, include_cards: bool = False) -> BoardList | None:
        query = select(BoardList)
        if include_cards:
            query = query.options(selectinload(BoardList.cards))
        query = query.where(BoardList.id == list_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_board_lists(self, board_id: int, include_cards: bool = False) -> Sequence[BoardList]:
        query = select(BoardList).where(BoardList.board_id == board_id)
        if include_cards:
            # Load cards with their assignees in a single query
            query = query.options(selectinload(BoardList.cards).joinedload(Card.assignee))
        query = query.order_by(BoardList.position)  # Order by position
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create_list(self, list_in: BoardListCreate) -> BoardList:
        query = select(func.max(BoardList.position)).where(BoardList.board_id == list_in.board_id)
        result = await self.session.execute(query)
        max_position = result.scalar() or -1
        list_data = list_in.model_dump()
        list_data["position"] = max_position + 1

        db_list = BoardList(**list_data)
        self.session.add(db_list)
        await self.session.commit()
        await self.session.refresh(db_list)
        return db_list

    async def update_list(self, db_list: BoardList, update_data: dict) -> BoardList:
        for field, value in update_data.items():
            setattr(db_list, field, value)

        await self.session.commit()
        await self.session.refresh(db_list)
        return db_list

    async def delete_list(self, list_id: int) -> bool:
        list_obj = await self.get_list(list_id)
        if not list_obj:
            return False

        query = select(BoardList).where(BoardList.board_id == list_obj.board_id, BoardList.position > list_obj.position)
        result = await self.session.execute(query)
        higher_lists = result.scalars().all()

        for l in higher_lists:
            l.position -= 1

        await self.session.delete(list_obj)
        await self.session.commit()
        return True

    async def reorder_list(self, list_id: int, new_position: int) -> ResponseBoardList | None:
        list_obj = await self.get_list(list_id)
        if not list_obj:
            return None

        board_lists = await self.get_board_lists(list_obj.board_id)

        old_position = list_obj.position
        logger.debug(f"Reordering list {list_id} from position {old_position} to {new_position}")
        for l in board_lists:
            if old_position < new_position:
                if l.position > old_position and l.position <= new_position:
                    l.position -= 1
            else:
                if l.position >= new_position and l.position < old_position:
                    l.position += 1

        list_obj.position = new_position
        await self.session.commit()
        await self.session.refresh(list_obj)
        return list_obj
