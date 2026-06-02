"""
api/main.py
===========
FastAPI backend cho AI Puzzle Solver.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

from puzzle.state     import PuzzleState, make_goal, make_random_state
from astar.heuristics import manhattan_distance, NNHeuristic
from astar.search     import astar

app = FastAPI(title="AI Puzzle Solver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── load NN một lần khi khởi động ─────────────────────────────────────────
_nn_cache = {}

def get_nn(size: int) -> Optional[NNHeuristic]:
    if size not in _nn_cache:
        nn = NNHeuristic(size=size, hidden_sizes=[128, 64])
        
        # Đồng bộ tên file trọng số chính xác với file bạn đã train ra
        weight_path = f"best_weights_size{size}.npy"
        
        # Nếu không tìm thấy ở thư mục gốc, kiểm tra thêm trong thư mục api/
        if not os.path.exists(weight_path):
            weight_path = os.path.join("api", f"best_weights_size{size}.npy")

        if os.path.exists(weight_path):
            nn.load(weight_path)
            _nn_cache[size] = nn
            print(f"  ✓ Loaded NN weights thành công từ: {weight_path}")
        else:
            # Dùng trọng số ngẫu nhiên nếu không tìm thấy file
            _nn_cache[size] = nn
            print(f"  ⚠ Không tìm thấy {weight_path}, AI sẽ dùng trọng số chưa train")
    return _nn_cache[size]


# ── schemas ───────────────────────────────────────────────────────────────

class SolveRequest(BaseModel):
    tiles : List[int]   # chuỗi 1D, 0 = ô trống
    size  : int         # cạnh lưới

class HeuristicResult(BaseModel):
    name        : str
    solved      : bool
    cost        : int
    nodes_exp   : int
    nodes_gen   : int
    time_ms     : float
    actions     : List[str]
    path_tiles  : List[List[int]]   # mỗi phần tử là chuỗi tiles tại bước đó

class SolveResponse(BaseModel):
    manhattan : HeuristicResult
    nn        : HeuristicResult

class RandomResponse(BaseModel):
    tiles : List[int]
    size  : int


# ── helpers ───────────────────────────────────────────────────────────────

def run_heuristic(start_tiles, size, heuristic_fn, name) -> HeuristicResult:
    goal  = make_goal(size)
    start = PuzzleState(tuple(start_tiles), size)

    t0     = time.perf_counter()
    result = astar(start, goal, heuristic_fn, max_nodes=300_000)
    elapsed = (time.perf_counter() - t0) * 1000

    path_tiles = [list(s.tiles) for s in result.path] if result.found else []

    return HeuristicResult(
        name       = name,
        solved     = result.found,
        cost       = result.cost if result.found else -1,
        nodes_exp  = result.nodes_exp,
        nodes_gen  = result.nodes_gen,
        time_ms    = round(elapsed, 2),
        actions    = result.actions if result.found else [],
        path_tiles = path_tiles,
    )


# ── endpoints ─────────────────────────────────────────────────────────────

@app.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest):
    size = req.size
    if size not in (3, 4):
        raise HTTPException(400, "Chỉ hỗ trợ size=3 (8-puzzle) hoặc size=4 (15-puzzle)")
    if len(req.tiles) != size * size:
        raise HTTPException(400, f"Cần {size*size} ô, nhận {len(req.tiles)}")

    nn = get_nn(size)

    mh_result = run_heuristic(req.tiles, size, manhattan_distance, "Manhattan Distance")
    nn_result  = run_heuristic(req.tiles, size, lambda s, g: nn(s, g), "NN Heuristic")

    return SolveResponse(manhattan=mh_result, nn=nn_result)


@app.get("/random", response_model=RandomResponse)
def random_puzzle(size: int = 3, difficulty: int = 25, seed: int = None):
    if size not in (3, 4):
        raise HTTPException(400, "Chỉ hỗ trợ size=3 hoặc size=4")
    s = int(np.random.randint(0, 1_000_000)) if seed is None else seed
    state = make_random_state(size, shuffle_steps=difficulty, seed=s)
    return RandomResponse(tiles=list(state.tiles), size=size)


@app.get("/health")
def health():
    return {"status": "ok"}