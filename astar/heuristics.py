"""
astar/heuristics.py
===================
Các hàm heuristic cho A*.

1. manhattan_distance  – heuristic cổ điển (admissible)
2. NNHeuristic         – heuristic từ Neural Network (có thể không admissible,
                         nhưng thường cho đường đi ngắn hơn về số nodes mở rộng)
"""

from __future__ import annotations
import numpy as np
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from puzzle.state import PuzzleState


# ── 1. Manhattan Distance ─────────────────────────────────────────────────

def manhattan_distance(state: "PuzzleState", goal: "PuzzleState") -> int:
    """
    Tổng khoảng cách Manhattan của từng ô đến vị trí đích.
    Admissible (không bao giờ đánh giá quá cao cost thực).
    """
    size  = state.size
    total = 0
    goal_pos = {val: idx for idx, val in enumerate(goal.tiles)}  # val → vị trí đích

    for idx, val in enumerate(state.tiles):
        if val == 0:
            continue
        cur_r,  cur_c  = divmod(idx,               size)
        goal_r, goal_c = divmod(goal_pos[val],     size)
        total += abs(cur_r - goal_r) + abs(cur_c - goal_c)

    return total


# ── 2. Neural Network Heuristic ───────────────────────────────────────────

class NNHeuristic:
    """
    Heuristic h(s) ≈ số bước tối ưu từ s đến goal,
    được xấp xỉ bằng một mạng nơ-ron feed-forward nhỏ.

    Kiến trúc: Input → Linear → ReLU → Linear → ReLU → Linear(1) → ReLU
                                                               ↑
                                                    (đảm bảo h ≥ 0)

    Các trọng số W được lưu dưới dạng numpy arrays và được
    tối ưu bởi thuật toán tiến hóa (GA/DE) ở module evolution/.
    """

    def __init__(self, size: int, hidden_sizes: list[int] = None):
        """
        Parameters
        ----------
        size         : cạnh lưới (3 hoặc 4)
        hidden_sizes : danh sách số neuron ẩn, mặc định [128, 64]
        """
        self.size   = size
        n           = size * size
        input_size  = n * n           # one-hot encoding
        hidden_sizes = hidden_sizes or [128, 64]

        # ── xây dựng danh sách layer ───────────────────────────────────
        layer_sizes = [input_size] + hidden_sizes + [1]
        self.layer_sizes = layer_sizes

        # ── khởi tạo trọng số ngẫu nhiên (He init) ────────────────────
        self.weights: list[np.ndarray] = []   # W[l]: shape (out, in)
        self.biases:  list[np.ndarray] = []   # b[l]: shape (out,)

        rng = np.random.default_rng(42)
        for i in range(len(layer_sizes) - 1):
            fan_in  = layer_sizes[i]
            fan_out = layer_sizes[i + 1]
            W = rng.normal(0, np.sqrt(2.0 / fan_in), (fan_out, fan_in)).astype(np.float32)
            b = np.zeros(fan_out, dtype=np.float32)
            self.weights.append(W)
            self.biases.append(b)

    # ── forward pass ─────────────────────────────────────────────────────
    def predict(self, x: np.ndarray) -> float:
        """
        x: one-hot vector (float32, shape [input_size])
        Trả về giá trị h ≥ 0.
        """
        h = x
        for i, (W, b) in enumerate(zip(self.weights, self.biases)):
            h = W @ h + b
            if i < len(self.weights) - 1:
                h = np.maximum(h, 0)   # ReLU
        return float(max(0.0, h[0]))   # output layer + clamp ≥ 0

    def __call__(self, state: "PuzzleState", goal: "PuzzleState") -> float:
        x = state.to_tensor_input()
        return self.predict(x)

    # ── flatten / unflatten trọng số (dùng cho GA/DE) ────────────────────
    def get_flat_weights(self) -> np.ndarray:
        """Trả về tất cả trọng số dưới dạng vector 1D."""
        parts = []
        for W, b in zip(self.weights, self.biases):
            parts.append(W.ravel())
            parts.append(b.ravel())
        return np.concatenate(parts).astype(np.float32)

    def set_flat_weights(self, flat: np.ndarray) -> None:
        """Nạp vector 1D trọng số vào mạng."""
        idx = 0
        for i, (W, b) in enumerate(zip(self.weights, self.biases)):
            wsize = W.size
            bsize = b.size
            self.weights[i] = flat[idx:idx + wsize].reshape(W.shape)
            idx += wsize
            self.biases[i]  = flat[idx:idx + bsize].reshape(b.shape)
            idx += bsize

    @property
    def n_params(self) -> int:
        """Tổng số tham số."""
        total = 0
        for W, b in zip(self.weights, self.biases):
            total += W.size + b.size
        return total

    def save(self, path: str) -> None:
        np.save(path, self.get_flat_weights())

    def load(self, path: str) -> None:
        self.set_flat_weights(np.load(path))
