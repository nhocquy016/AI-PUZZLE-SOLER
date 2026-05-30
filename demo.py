"""
demo.py
=======
Demo nhanh: giải một bài puzzle và in kết quả.

  python demo.py --size 3 --weights best_weights.npy
  python demo.py --size 3   # dùng Manhattan nếu chưa có weights
"""

import argparse
import numpy as np

from puzzle.state     import make_goal, make_random_state, PuzzleState
from astar.heuristics import manhattan_distance, NNHeuristic
from astar.search     import astar


def solve_and_print(start, goal, heuristic, name="Heuristic"):
    print(f"\n{'─'*40}")
    print(f"Heuristic: {name}")
    print(f"Start:\n{start}\n")
    result = astar(start, goal, heuristic, max_nodes=300_000)
    if result.found:
        print(f"✓ Giải được!")
        print(f"  Số bước      : {result.cost}")
        print(f"  Nodes mở rộng: {result.nodes_exp}")
        print(f"  Nodes tạo ra : {result.nodes_gen}")
        print(f"  Đường đi     : {' → '.join(result.actions)}")
    else:
        print("✗ Không tìm được lời giải (vượt giới hạn node)")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--size",    type=int, default=3)
    p.add_argument("--diff",    type=int, default=20, help="Độ khó (bước shuffle)")
    p.add_argument("--seed",    type=int, default=7)
    p.add_argument("--weights", type=str, default=None, help="File .npy trọng số NN")
    p.add_argument("--hidden",  type=str, default="128,64")
    args = p.parse_args()

    goal  = make_goal(args.size)
    start = make_random_state(args.size, args.diff, args.seed)

    print(f"Goal:\n{goal}\n")

    # Manhattan
    solve_and_print(
        PuzzleState(start.tiles, start.size), goal,
        manhattan_distance, "Manhattan Distance"
    )

    # NN (nếu có weights)
    if args.weights:
        hidden = [int(x) for x in args.hidden.split(",")]
        nn = NNHeuristic(size=args.size, hidden_sizes=hidden)
        nn.load(args.weights)
        solve_and_print(
            PuzzleState(start.tiles, start.size), goal,
            lambda s, g: nn(s, g), "NN Heuristic"
        )
    else:
        print("\n(Chưa có file weights – chạy train.py trước để huấn luyện NN)")


if __name__ == "__main__":
    main()
