"""
train.py
========
Vòng lặp huấn luyện chính:

  1. Tạo tập bài toán huấn luyện
  2. Khởi tạo NNHeuristic
  3. Chạy GA hoặc DE để tối ưu trọng số NN
  4. Lưu trọng số tốt nhất
  5. Đánh giá và so sánh với Manhattan Distance

Sử dụng:
  python train.py --size 3 --algo de --pop 40 --gen 80
  python train.py --size 4 --algo ga --pop 60 --gen 100 --puzzles 15
"""

import argparse
import time
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from puzzle.state     import make_goal, make_random_state, PuzzleState
from astar.heuristics import manhattan_distance, NNHeuristic
from astar.search     import astar
from evolution.optimizer import (
    GeneticAlgorithm, DifferentialEvolution,
    evaluate_weights, make_training_puzzles,
)


# ── CLI ───────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="Train NN heuristic với GA/DE")
    p.add_argument("--size",    type=int,   default=3,    help="Kích thước lưới (3=8-puzzle, 4=15-puzzle)")
    p.add_argument("--algo",    type=str,   default="de", choices=["ga","de"])
    p.add_argument("--pop",     type=int,   default=40,   help="Kích thước quần thể")
    p.add_argument("--gen",     type=int,   default=80,   help="Số thế hệ")
    p.add_argument("--puzzles", type=int,   default=20,   help="Số bài toán huấn luyện")
    p.add_argument("--diff",    type=int,   default=25,   help="Độ khó (số bước shuffle)")
    p.add_argument("--hidden",  type=str,   default="128,64", help="Kiến trúc NN, vd: 128,64")
    p.add_argument("--seed",    type=int,   default=42)
    p.add_argument("--save",    type=str,   default="best_weights.npy")
    p.add_argument("--eval",    type=int,   default=50,   help="Số puzzle đánh giá sau train")
    return p.parse_args()


# ── đánh giá so sánh ─────────────────────────────────────────────────────

def benchmark(nn: NNHeuristic, size: int, n: int = 50, diff: int = 25, seed: int = 99):
    goal    = make_goal(size)
    puzzles = make_training_puzzles(size, n, diff, seed)

    results_mh = []
    results_nn = []

    for i, (start, _) in enumerate(puzzles):
        fresh = PuzzleState(start.tiles, start.size)

        r_mh = astar(fresh, goal, manhattan_distance, max_nodes=200_000)
        r_nn = astar(PuzzleState(start.tiles, start.size), goal,
                     lambda s, g: nn(s, g), max_nodes=200_000)

        results_mh.append(r_mh)
        results_nn.append(r_nn)

        if (i + 1) % 10 == 0:
            print(f"  Benchmark {i+1}/{n} ...")

    def summarize(results, name):
        solved   = [r for r in results if r.found]
        if not solved:
            print(f"  {name}: Không giải được puzzle nào!")
            return
        avg_exp  = np.mean([r.nodes_exp  for r in solved])
        avg_cost = np.mean([r.cost       for r in solved])
        solve_r  = len(solved) / len(results) * 100
        print(f"\n  {'─'*40}")
        print(f"  {name}")
        print(f"    Tỉ lệ giải được : {solve_r:.1f}%  ({len(solved)}/{len(results)})")
        print(f"    Nodes mở rộng   : {avg_exp:.1f} (trung bình)")
        print(f"    Độ dài đường đi : {avg_cost:.1f} bước (trung bình)")

    summarize(results_mh, "Manhattan Distance")
    summarize(results_nn, "NN Heuristic (after training)")
    return results_mh, results_nn


# ── vẽ biểu đồ ────────────────────────────────────────────────────────────

def plot_history(history, algo_name, save_path="training_curve.png"):
    plt.figure(figsize=(9, 4))
    plt.plot(history, linewidth=2, color="#2196F3")
    plt.title(f"Fitness qua các thế hệ – {algo_name.upper()}", fontsize=14)
    plt.xlabel("Generation")
    plt.ylabel("Total nodes expanded (↓ better)")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=120)
    print(f"\n  Biểu đồ lưu tại: {save_path}")


# ── main ─────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    np.random.seed(args.seed)

    hidden = [int(x) for x in args.hidden.split(",")]
    print(f"\n{'='*55}")
    print(f"  AI Puzzle Solver – NN Heuristic + {args.algo.upper()}")
    print(f"  Puzzle : {'8-puzzle (3×3)' if args.size==3 else '15-puzzle (4×4)'}")
    print(f"  NN     : input → {' → '.join(str(h) for h in hidden)} → 1")
    print(f"  Algo   : {args.algo.upper()}  pop={args.pop}  gen={args.gen}")
    print(f"{'='*55}\n")

    # ── 1. Tạo tập huấn luyện ─────────────────────────────────────────
    print(f"[1/4] Tạo {args.puzzles} puzzle huấn luyện (size={args.size}, diff={args.diff}) ...")
    train_puzzles = make_training_puzzles(args.size, args.puzzles, args.diff, args.seed)

    # ── 2. Khởi tạo NN ────────────────────────────────────────────────
    print(f"[2/4] Khởi tạo NNHeuristic ...")
    nn = NNHeuristic(size=args.size, hidden_sizes=hidden)
    print(f"      Tổng tham số: {nn.n_params:,}")

    # ── 3. Định nghĩa fitness và chạy optimizer ───────────────────────
    def fitness_fn(flat_w):
        return evaluate_weights(flat_w, nn, train_puzzles)

    print(f"[3/4] Chạy {args.algo.upper()} ...")
    t0 = time.time()

    if args.algo == "ga":
        optimizer = GeneticAlgorithm(
            pop_size=args.pop, n_generations=args.gen, seed=args.seed
        )
    else:
        optimizer = DifferentialEvolution(
            pop_size=args.pop, n_generations=args.gen, seed=args.seed
        )

    result = optimizer.optimize(fitness_fn, nn.n_params, verbose=True)

    print(f"\n  ✓ Hoàn thành sau {result.elapsed:.1f}s")
    print(f"  Best fitness: {result.best_fitness:.1f} nodes")

    # ── 4. Lưu trọng số và vẽ biểu đồ ────────────────────────────────
    nn.set_flat_weights(result.best_weights)
    nn.save(args.save)
    print(f"  Trọng số lưu tại: {args.save}")
    plot_history(result.history, args.algo)

    # ── 5. Benchmark ──────────────────────────────────────────────────
    print(f"\n[4/4] Benchmark trên {args.eval} puzzle mới ...")
    benchmark(nn, args.size, n=args.eval, diff=args.diff, seed=args.seed + 1)

    print(f"\n{'='*55}")
    print("  Xong! Dùng lệnh sau để dùng NN heuristic đã train:")
    print(f"    from astar.heuristics import NNHeuristic")
    print(f"    nn = NNHeuristic(size={args.size}, hidden_sizes={hidden})")
    print(f"    nn.load('{args.save}')")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
