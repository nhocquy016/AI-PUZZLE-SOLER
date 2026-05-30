# AI Puzzle Solver — A* + Neural Network Heuristic + GA/DE

## Mô tả
Project giải bài toán **N-puzzle** (8-puzzle 3×3, 15-puzzle 4×4) sử dụng:
- **A\*** kết hợp hàm heuristic học được từ **mạng nơ-ron**
- Tham số NN được tối ưu bằng **Genetic Algorithm (GA)** hoặc **Differential Evolution (DE)**
- Giao diện web hiển thị **so sánh trực tiếp** Manhattan Distance vs NN Heuristic

---

## Cấu trúc project

```
ai_puzzle/
├── puzzle/
│   └── state.py          # Biểu diễn trạng thái N-puzzle
├── astar/
│   ├── heuristics.py     # Manhattan Distance + NNHeuristic
│   └── search.py         # Thuật toán A* và IDA*
├── evolution/
│   └── optimizer.py      # Genetic Algorithm + Differential Evolution
├── api/
│   └── main.py           # FastAPI backend
├── frontend/
│   └── App.jsx           # React frontend
├── train.py              # Script huấn luyện chính
├── demo.py               # Demo nhanh trên terminal
└── README.md
```

---

## Cài đặt

### Backend (Python)
```bash
pip install fastapi uvicorn numpy matplotlib
```

### Frontend (Node.js)
```bash
npm create vite@latest frontend_app -- --template react
cd frontend_app
cp ../frontend/App.jsx src/App.jsx
npm install
```

---

## Chạy project

### 1. Huấn luyện NN với DE (khuyến nghị)
```bash
# 8-puzzle (3×3) — nhanh ~2-5 phút
python train.py --size 3 --algo de --pop 40 --gen 80

# 15-puzzle (4×4) — chậm hơn
python train.py --size 4 --algo de --pop 60 --gen 100 --puzzles 15 --diff 20
```

### 2. Chạy backend API
```bash
uvicorn api.main:app --reload --port 8000
```

### 3. Chạy frontend
```bash
cd frontend_app && npm run dev
# Mở http://localhost:5173
```

### 4. Demo nhanh trên terminal
```bash
python demo.py --size 3 --diff 20
python demo.py --size 3 --weights best_weights_size3.npy
```

---

## Kiến trúc thuật toán

```
Trạng thái puzzle
      ↓
   A* Search
      ↓  f(n) = g(n) + h(n)
  h(n) từ NNHeuristic         ← Trọng số W
      ↓
  Neural Network               ← one-hot input → ReLU → ... → h ≥ 0
      ↑
  GA / DE tối ưu W
  (fitness = tổng nodes expanded trên tập train)
```

### Neural Network
- **Input**: One-hot encoding, kích thước `(n²)²`
  - 81 neurons cho 8-puzzle, 256 neurons cho 15-puzzle
- **Hidden**: [128, 64] ReLU neurons
- **Output**: 1 neuron (h ≥ 0)

### Genetic Algorithm
- Tournament selection + Uniform crossover + Gaussian mutation
- Elitism: giữ top 10% mỗi thế hệ

### Differential Evolution
- Chiến lược DE/rand/1/bin
- F=0.8 (scale factor), CR=0.9 (crossover rate)
- Thường hội tụ nhanh và tốt hơn GA cho bài toán này

---

## Tham số huấn luyện gợi ý

| Puzzle | pop | gen | puzzles | diff | Thời gian |
|--------|-----|-----|---------|------|-----------|
| 3×3    | 40  | 80  | 20      | 25   | ~3 phút   |
| 4×4    | 60  | 100 | 15      | 20   | ~20 phút  |

---

## Kết quả kỳ vọng

Sau huấn luyện, NN heuristic thường:
- Mở rộng **ít nodes hơn** 20-40% so với Manhattan (NN đoán gần hơn)
- Đường đi có thể dài hơn 1-2 bước (vì NN không admissible)
- Với Weighted A* (weight=1.5) trong lúc train: nhanh hơn nhưng kém tối ưu hơn
