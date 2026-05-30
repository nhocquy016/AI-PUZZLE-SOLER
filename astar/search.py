"""
astar/search.py
===============
Thuật toán A* tổng quát cho N-puzzle.

A* tìm đường đi tối ưu bằng cách mở rộng node có f(n) = g(n) + h(n) nhỏ nhất.
  g(n) = chi phí thực từ start đến n
  h(n) = ước lượng chi phí từ n đến goal (heuristic)

Nếu h là admissible (không overestimate), A* đảm bảo tối ưu.
"""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Callable, Optional, Tuple

from puzzle.state import PuzzleState


# ── kết quả tìm kiếm ─────────────────────────────────────────────────────

@dataclass
class SearchResult:
    found      : bool                        # tìm thấy lời giải?
    path       : list[PuzzleState]           # danh sách trạng thái từ start → goal
    actions    : list[str]                   # danh sách hành động
    cost       : int                         # số bước
    nodes_exp  : int                         # số node đã mở rộng
    nodes_gen  : int                         # số node đã tạo ra


# ── A* ───────────────────────────────────────────────────────────────────

def astar(
    start     : PuzzleState,
    goal      : PuzzleState,
    heuristic : Callable[[PuzzleState, PuzzleState], float],
    max_nodes : int = 500_000,
    weight    : float = 1.0,
) -> SearchResult:
    """
    Tìm kiếm A* (hoặc Weighted A* nếu weight > 1).

    Parameters
    ----------
    start     : trạng thái bắt đầu
    goal      : trạng thái đích
    heuristic : h(state, goal) → float
    max_nodes : giới hạn số node mở rộng (tránh vòng lặp vô tận)
    weight    : hệ số nhân h (weight=1 → A* chuẩn; weight>1 → nhanh hơn, ít tối ưu hơn)

    Returns
    -------
    SearchResult
    """
    # heap: (f, tie_breaker, state)
    counter    = 0
    h0         = heuristic(start, goal)
    open_heap  : list[Tuple[float, int, PuzzleState]] = []
    heapq.heappush(open_heap, (h0, counter, start))

    # g_cost lưu chi phí tốt nhất đã biết đến mỗi state
    g_cost  = {start.tiles: 0}
    visited = set()

    nodes_exp = 0
    nodes_gen = 1   # start

    while open_heap and nodes_exp < max_nodes:
        f, _, current = heapq.heappop(open_heap)

        if current.tiles in visited:
            continue
        visited.add(current.tiles)
        nodes_exp += 1

        # ── kiểm tra đích ─────────────────────────────────────────────
        if current.is_goal(goal):
            path    = current.path()
            actions = [s.action for s in path if s.action is not None]
            return SearchResult(
                found=True,
                path=path,
                actions=actions,
                cost=current.g,
                nodes_exp=nodes_exp,
                nodes_gen=nodes_gen,
            )

        # ── mở rộng node ──────────────────────────────────────────────
        for child in current.successors():
            if child.tiles in visited:
                continue
            new_g = current.g + 1
            if new_g < g_cost.get(child.tiles, float("inf")):
                child.g               = new_g
                g_cost[child.tiles]   = new_g
                h                     = heuristic(child, goal)
                f_child               = new_g + weight * h
                counter              += 1
                nodes_gen            += 1
                heapq.heappush(open_heap, (f_child, counter, child))

    # không tìm thấy (hết node hoặc bài toán không giải được)
    return SearchResult(
        found=False, path=[], actions=[],
        cost=-1, nodes_exp=nodes_exp, nodes_gen=nodes_gen,
    )


# ── IDA* (tiết kiệm bộ nhớ hơn) ──────────────────────────────────────────

def idastar(
    start     : PuzzleState,
    goal      : PuzzleState,
    heuristic : Callable[[PuzzleState, PuzzleState], float],
    max_iter  : int = 100,
) -> SearchResult:
    """
    Iterative Deepening A* – tốt cho 15-puzzle khi RAM hạn chế.
    """
    bound    = heuristic(start, goal)
    path_    = [start]
    nodes_exp = 0
    nodes_gen = 1

    for _ in range(max_iter):
        result = _ida_search(path_, goal, 0, bound, heuristic)

        if isinstance(result, list):   # tìm thấy lời giải
            full_path = result
            actions   = [s.action for s in full_path if s.action]
            return SearchResult(
                found=True,
                path=full_path,
                actions=actions,
                cost=len(actions),
                nodes_exp=nodes_exp,
                nodes_gen=nodes_gen,
            )
        if result == float("inf"):
            break
        bound = result

    return SearchResult(
        found=False, path=[], actions=[],
        cost=-1, nodes_exp=nodes_exp, nodes_gen=nodes_gen,
    )


def _ida_search(path, goal, g, bound, heuristic):
    current = path[-1]
    f = g + heuristic(current, goal)
    if f > bound:
        return f
    if current.is_goal(goal):
        return list(path)
    min_t = float("inf")
    for child in current.successors():
        if any(s.tiles == child.tiles for s in path):   # tránh cycle
            continue
        child.g = g + 1
        path.append(child)
        result = _ida_search(path, goal, g + 1, bound, heuristic)
        if isinstance(result, list):
            return result
        if result < min_t:
            min_t = result
        path.pop()
    return min_t
