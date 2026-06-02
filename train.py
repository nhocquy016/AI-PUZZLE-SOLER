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




if __name__ == "__main__":
    main()
