from typing import Sequence

from src.schemas.board import BoardCreate, BoardUpdate
from src.models import Board
from src.repositories import BaseRepository


class BoardService:
    def __init__(self, repository: BaseRepository):
        self.repository = repository

    async def get_boards(self, user_id: int) -> Sequence[Board]:
        return await self.repository.get_boards_with_lists(user_id)

    async def get_board(self, board_id: int) -> Board | None:
        return await self.repository.get_board_with_lists(board_id)

    async def create_board(self, board_in: BoardCreate, user_id: int) -> Board:
        board = board_in.model_dump()
        board["owner_id"] = user_id
        del board["background_color"]
        return await self.repository.create(board)

    async def update_board(self, db_board: Board, board_in: BoardUpdate) -> Board:
        board_update = board_in.model_dump(exclude_unset=True)
        return await self.repository.update_board(db_board, board_update)

    async def delete_board(self, board_id: int) -> None:
        await self.repository.delete_board(board_id)

