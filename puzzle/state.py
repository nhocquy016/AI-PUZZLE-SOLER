"""
puzzle/state.py
===============
Biểu diễn trạng thái bài toán N-puzzle (8-puzzle 3x3, 15-puzzle 4x4, ...)

Trạng thái là một tuple 1D để có thể dùng làm key trong dict (hashable).
  Ví dụ 8-puzzle goal: (1,2,3,4,5,6,7,8,0)  — 0 là ô trống
"""

from __future__ import annotations
import numpy as np
from typing import List, Tuple, Optional


class PuzzleState:
    """
    Đại diện một trạng thái của N-puzzle.

    Attributes
    ----------
    tiles : tuple[int, ...]   – chuỗi 1D, 0 = ô trống
    size  : int               – cạnh lưới (3 → 8-puzzle, 4 → 15-puzzle)
    parent: PuzzleState|None  – trạng thái cha (để truy vết đường đi)
    action: str|None          – hành động sinh ra trạng thái này ('U','D','L','R')
    g     : int               – cost thực từ start đến đây
    """

    __slots__ = ("tiles", "size", "parent", "action", "g")

    def __init__(
        self,
        tiles: Tuple[int, ...],
        size: int,
        parent: Optional["PuzzleState"] = None,
        action: Optional[str] = None,
        g: int = 0,
    ):
        self.tiles  = tiles
        self.size   = size
        self.parent = parent
        self.action = action
        self.g      = g

    # ── so sánh & hashing (dùng cho tập visited và heap) ──────────────────
    def __eq__(self, other: object) -> bool:
        return isinstance(other, PuzzleState) and self.tiles == other.tiles

    def __hash__(self) -> int:
        return hash(self.tiles)

    def __lt__(self, other: "PuzzleState") -> bool:
        # cần cho heapq khi f bằng nhau
        return self.g < other.g

    # ── tiện ích ──────────────────────────────────────────────────────────
    def to_numpy(self) -> np.ndarray:
        """Chuyển về mảng 2D NumPy (size×size)."""
        return np.array(self.tiles, dtype=np.int32).reshape(self.size, self.size)

    def to_tensor_input(self) -> np.ndarray:
        """
        One-hot encoding phẳng cho Neural Network.
        Kích thước đầu ra: size*size * (size*size)
          = 9*9=81 cho 8-puzzle, 16*16=256 cho 15-puzzle
        """
        n = self.size * self.size
        out = np.zeros(n * n, dtype=np.float32)
        for idx, val in enumerate(self.tiles):
            out[idx * n + val] = 1.0
        return out

    @property
    def blank_pos(self) -> int:
        """Vị trí ô trống trong chuỗi 1D."""
        return self.tiles.index(0)

    def is_goal(self, goal: "PuzzleState") -> bool:
        return self.tiles == goal.tiles

    # ── sinh các trạng thái kế tiếp ───────────────────────────────────────
    def successors(self) -> List["PuzzleState"]:
        """
        Trả về danh sách (tối đa 4) trạng thái kế tiếp hợp lệ.
        Di chuyển ô trống: U / D / L / R
        """
        results = []
        idx     = self.blank_pos
        row, col = divmod(idx, self.size)
        moves = {
            "U": (row - 1, col),
            "D": (row + 1, col),
            "L": (row,     col - 1),
            "R": (row,     col + 1),
        }
        tiles_list = list(self.tiles)
        for action, (nr, nc) in moves.items():
            if 0 <= nr < self.size and 0 <= nc < self.size:
                new_idx            = nr * self.size + nc
                new_tiles          = tiles_list.copy()
                new_tiles[idx], new_tiles[new_idx] = new_tiles[new_idx], new_tiles[idx]
                results.append(
                    PuzzleState(
                        tuple(new_tiles), self.size,
                        parent=self, action=action, g=self.g + 1,
                    )
                )
        return results

    # ── đường đi ──────────────────────────────────────────────────────────
    def path(self) -> List["PuzzleState"]:
        """Truy vết từ trạng thái hiện tại về start."""
        node, result = self, []
        while node:
            result.append(node)
            node = node.parent
        return list(reversed(result))

    def __repr__(self) -> str:
        grid = self.to_numpy()
        rows = []
        for row in grid:
            rows.append(" ".join(f"{v:2d}" for v in row))
        return "\n".join(rows)


# ── hàm tiện ích tạo trạng thái ───────────────────────────────────────────

def make_goal(size: int) -> PuzzleState:
    """Goal state: 1,2,...,n²-1,0"""
    n = size * size
    tiles = tuple(range(1, n)) + (0,)
    return PuzzleState(tiles, size)


def make_random_state(size: int, shuffle_steps: int = 100, seed: int = None) -> PuzzleState:
    """
    Tạo trạng thái ngẫu nhiên bằng cách shuffle từ goal.
    Đảm bảo solvable vì ta chỉ thực hiện các bước hợp lệ.
    """
    rng   = np.random.default_rng(seed)
    state = make_goal(size)
    for _ in range(shuffle_steps):
        succs = state.successors()
        # tránh đi ngược lại cha
        valid = [s for s in succs if s.tiles != (state.parent.tiles if state.parent else None)]
        state = rng.choice(valid if valid else succs)
        state.parent = None  # xoá parent để không chiếm RAM
    state.g = 0
    return state
