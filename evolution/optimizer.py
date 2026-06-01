# Author: Do Duy Duc - Genetic Algorithm & Differential Evolution f"""
evolution/optimizer.py
======================
Tối ưu trọng số Neural Network bằng thuật toán tiến hóa.

Hai thuật toán được cài đặt:
  1. GA  – Genetic Algorithm (chọn lọc + crossover + mutation)
  2. DE  – Differential Evolution (đơn giản hơn, thường hội tụ nhanh hơn)

Fitness function: đánh giá chất lượng bộ trọng số W bằng cách
  chạy A* với NNHeuristic(W) trên một tập puzzle mẫu và đo
  tổng số node mở rộng (càng ít càng tốt).
"""

from __future__ import annotations

import time
import numpy as np
from typing import Callable, List, Tuple
from dataclasses import dataclass

from puzzle.state   import PuzzleState, make_goal, make_random_state
from astar.heuristics import NNHeuristic
from astar.search   import astar


# ── fitness ──────────────────────────────────────────────────────────────

def evaluate_weights(
    flat_weights : np.ndarray,
    nn           : NNHeuristic,
    puzzles      : List[Tuple[PuzzleState, PuzzleState]],   # (start, goal)
    max_nodes    : int = 10_000,
    weight_wa    : float = 1.5,   # Weighted A* để chạy nhanh hơn lúc train
) -> float:
    """
    Fitness = tổng nodes_expanded trên tập puzzles.
    Trả về giá trị âm (để dễ dùng với min/max).
    Nếu không giải được: phạt max_nodes.
    """
    nn.set_flat_weights(flat_weights)

    total = 0.0
    for start, goal in puzzles:
        # reset parent để tránh chiếm RAM giữa các lần evaluate
        fresh_start = PuzzleState(start.tiles, start.size)
        result = astar(
            fresh_start, goal,
            heuristic=lambda s, g: nn(s, g),
            max_nodes=max_nodes,
            weight=weight_wa,
        )
        total += result.nodes_exp if result.found else max_nodes
    return total   # nhỏ hơn = tốt hơn


# ── kết quả chạy optimizer ───────────────────────────────────────────────

@dataclass
class EvoResult:
    best_weights : np.ndarray
    best_fitness : float
    history      : List[float]   # fitness tốt nhất mỗi generation
    elapsed      : float


# ══════════════════════════════════════════════════════════════════════════
# 1. Genetic Algorithm
# ══════════════════════════════════════════════════════════════════════════

class GeneticAlgorithm:
    """
    GA tiêu chuẩn với:
      - Tournament selection
      - Uniform crossover
      - Gaussian mutation với adaptive rate
    """

    def __init__(
        self,
        pop_size      : int   = 50,
        n_generations : int   = 100,
        mutation_rate : float = 0.1,
        mutation_std  : float = 0.05,
        crossover_rate: float = 0.7,
        tournament_k  : int   = 3,
        elite_frac    : float = 0.1,
        seed          : int   = None,
    ):
        self.pop_size       = pop_size
        self.n_generations  = n_generations
        self.mutation_rate  = mutation_rate
        self.mutation_std   = mutation_std
        self.crossover_rate = crossover_rate
        self.tournament_k   = tournament_k
        self.n_elite        = max(1, int(pop_size * elite_frac))
        self.rng            = np.random.default_rng(seed)

    def optimize(
        self,
        fitness_fn   : Callable[[np.ndarray], float],
        n_params     : int,
        verbose      : bool = True,
        callback     : Callable[[int, float, np.ndarray], None] = None,
    ) -> EvoResult:
        """
        Parameters
        ----------
        fitness_fn : hàm nhận vector trọng số → float (nhỏ = tốt)
        n_params   : số chiều không gian tìm kiếm
        """
        t0 = time.time()

        # ── khởi tạo quần thể ─────────────────────────────────────────
        pop = self.rng.normal(0, 0.1, (self.pop_size, n_params)).astype(np.float32)
        fits = np.array([fitness_fn(ind) for ind in pop])
        history = []

        for gen in range(self.n_generations):
            # ── elitism: giữ top ──────────────────────────────────────
            elite_idx = np.argsort(fits)[: self.n_elite]
            new_pop   = [pop[i].copy() for i in elite_idx]
            new_fits  = [fits[i] for i in elite_idx]

            # ── sinh thế hệ mới ───────────────────────────────────────
            while len(new_pop) < self.pop_size:
                p1 = self._tournament(pop, fits)
                p2 = self._tournament(pop, fits)
                child = self._crossover(p1, p2)
                child = self._mutate(child)
                new_pop.append(child)
                new_fits.append(fitness_fn(child))

            pop  = np.array(new_pop)
            fits = np.array(new_fits)

            best_f = fits.min()
            history.append(float(best_f))

            if verbose and (gen % 10 == 0 or gen == self.n_generations - 1):
                print(f"  GA gen {gen:4d}/{self.n_generations} | best_fitness={best_f:.1f}")

            if callback:
                callback(gen, best_f, pop[fits.argmin()])

        best_idx = fits.argmin()
        return EvoResult(
            best_weights=pop[best_idx].copy(),
            best_fitness=float(fits[best_idx]),
            history=history,
            elapsed=time.time() - t0,
        )

    def _tournament(self, pop, fits):
        idx = self.rng.choice(len(pop), self.tournament_k, replace=False)
        best = idx[np.argmin(fits[idx])]
        return pop[best]

    def _crossover(self, p1, p2):
        if self.rng.random() < self.crossover_rate:
            mask  = self.rng.random(len(p1)) < 0.5
            child = np.where(mask, p1, p2)
        else:
            child = p1.copy()
        return child

    def _mutate(self, ind):
        mask = self.rng.random(len(ind)) < self.mutation_rate
        ind[mask] += self.rng.normal(0, self.mutation_std, mask.sum()).astype(np.float32)
        return ind


# ══════════════════════════════════════════════════════════════════════════
# 2. Differential Evolution
# ══════════════════════════════════════════════════════════════════════════

class DifferentialEvolution:
    """
    DE/rand/1/bin – chiến lược phổ biến nhất.

    Mutation  : v = a + F*(b - c)   (a,b,c ngẫu nhiên, a≠b≠c≠target)
    Crossover : trial[j] = v[j] if rand<CR else target[j]
    Selection : chọn target hoặc trial theo fitness
    """

    def __init__(
        self,
        pop_size      : int   = 50,
        n_generations : int   = 100,
        F             : float = 0.8,    # scale factor
        CR            : float = 0.9,    # crossover rate
        seed          : int   = None,
    ):
        self.pop_size      = pop_size
        self.n_generations = n_generations
        self.F             = F
        self.CR            = CR
        self.rng           = np.random.default_rng(seed)

    def optimize(
        self,
        fitness_fn : Callable[[np.ndarray], float],
        n_params   : int,
        verbose    : bool = True,
        callback   : Callable[[int, float, np.ndarray], None] = None,
    ) -> EvoResult:
        t0 = time.time()

        # ── khởi tạo ──────────────────────────────────────────────────
        pop  = self.rng.normal(0, 0.1, (self.pop_size, n_params)).astype(np.float32)
        fits = np.array([fitness_fn(ind) for ind in pop])
        history = []

        for gen in range(self.n_generations):
            for i in range(self.pop_size):
                # chọn 3 cá thể khác
                candidates = [j for j in range(self.pop_size) if j != i]
                a, b, c = self.rng.choice(candidates, 3, replace=False)

                # mutation
                mutant = pop[a] + self.F * (pop[b] - pop[c])

                # crossover (binomial)
                cross_mask = self.rng.random(n_params) < self.CR
                cross_mask[self.rng.integers(n_params)] = True   # đảm bảo ≥ 1
                trial = np.where(cross_mask, mutant, pop[i]).astype(np.float32)

                # selection
                trial_fit = fitness_fn(trial)
                if trial_fit <= fits[i]:
                    pop[i]  = trial
                    fits[i] = trial_fit

            best_f = fits.min()
            history.append(float(best_f))

            if verbose and (gen % 10 == 0 or gen == self.n_generations - 1):
                print(f"  DE gen {gen:4d}/{self.n_generations} | best_fitness={best_f:.1f}")

            if callback:
                callback(gen, best_f, pop[fits.argmin()])

        best_idx = fits.argmin()
        return EvoResult(
            best_weights=pop[best_idx].copy(),
            best_fitness=float(fits[best_idx]),
            history=history,
            elapsed=time.time() - t0,
        )


# ── hàm tiện ích tạo tập huấn luyện ──────────────────────────────────────

def make_training_puzzles(
    size       : int,
    n_puzzles  : int = 20,
    difficulty : int = 30,    # số bước shuffle
    seed       : int = 0,
) -> List[Tuple[PuzzleState, PuzzleState]]:
    """Tạo n_puzzles bài toán ngẫu nhiên cùng goal tương ứng."""
    goal    = make_goal(size)
    puzzles = []
    rng     = np.random.default_rng(seed)
    for i in range(n_puzzles):
        start = make_random_state(size, shuffle_steps=difficulty, seed=int(rng.integers(1e6)))
        puzzles.append((start, goal))
    return puzzles
