/**
 * frontend_app/src/App.jsx
 * ========================
 * AI Puzzle Solver — Frontend chính
 *
 * Tính năng:
 *  - Lưới puzzle 3×3 / 4×4 responsive
 *  - Animation từng bước: play/pause, tốc độ điều chỉnh, highlight ô di chuyển
 *  - Kết nối API: /random tạo puzzle mới, /solve lấy kết quả giải
 *  - Biểu đồ so sánh: nodes, thời gian, số bước — Manhattan vs NN
 *  - Nhập tay puzzle hoặc kéo thả ô số
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PuzzleBoard from "./PuzzleBoard.jsx";
import Chart from "./Chart.jsx";

const API = "http://localhost:8000";

// ── helpers ────────────────────────────────────────────────────────────────

const makeGoal = (n) => {
  const arr = Array.from({ length: n * n - 1 }, (_, i) => i + 1);
  arr.push(0);
  return arr;
};

const manhattan = (tiles, n) => {
  const goal = makeGoal(n);
  const gpos = {};
  goal.forEach((v, i) => { if (v) gpos[v] = i; });
  return tiles.reduce((h, v, i) => {
    if (!v) return h;
    const gi = gpos[v];
    return h + Math.abs(Math.floor(i / n) - Math.floor(gi / n)) + Math.abs(i % n - gi % n);
  }, 0);
};

// local JS A* fallback
const localAstar = (startTiles, n, hFn = null) => {
  const goal = makeGoal(n);
  const goalKey = goal.join(",");
  const h = hFn || ((t) => manhattan(t, n));
  const heap = [[h(startTiles), 0, startTiles, [startTiles]]];
  const visited = new Set();
  const gcost = { [startTiles.join(",")]: 0 };
  let nodesExp = 0;
  const MAX = n === 3 ? 80000 : 20000;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (heap.length && nodesExp < MAX) {
    heap.sort((a, b) => a[0] - b[0]);
    const [, g, tiles, path] = heap.shift();
    const key = tiles.join(",");
    if (visited.has(key)) continue;
    visited.add(key); nodesExp++;
    if (key === goalKey) return { found: true, path, nodes: nodesExp, cost: path.length - 1 };
    const blank = tiles.indexOf(0);
    const row = Math.floor(blank / n), col = blank % n;
    for (const [dr, dc] of dirs) {
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const ni = nr * n + nc;
      const nt = [...tiles]; nt[blank] = nt[ni]; nt[ni] = 0;
      const nk = nt.join(",");
      if (visited.has(nk)) continue;
      const ng = g + 1;
      if (ng < (gcost[nk] ?? Infinity)) {
        gcost[nk] = ng;
        heap.push([ng + h(nt), ng, nt, [...path, nt]]);
      }
    }
  }
  return { found: false, path: [], nodes: nodesExp, cost: -1 };
};

const shuffleTiles = (n, steps) => {
  let tiles = makeGoal(n), blank = tiles.indexOf(0);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let prev = -1;
  for (let s = 0; s < steps; s++) {
    const r = Math.floor(blank / n), c = blank % n;
    const valid = dirs.map(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      return (nr >= 0 && nr < n && nc >= 0 && nc < n) ? nr * n + nc : -1;
    }).filter(x => x >= 0 && x !== prev);
    const next = valid[Math.floor(Math.random() * valid.length)];
    tiles[blank] = tiles[next]; tiles[next] = 0; prev = blank; blank = next;
  }
  return tiles;
};

// speed options in ms/frame
const SPEEDS = [
  { label: "0.5×", ms: 700 },
  { label: "1×",   ms: 350 },
  { label: "2×",   ms: 175 },
  { label: "4×",   ms: 80  },
];

// ── Styles ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f0f4ff;
    --surface:  #ffffff;
    --card:     #ffffff;
    --card2:    #f5f7ff;
    --border:   #dde3f5;
    --dim:      #c5cce8;
    --green:    #00a870;
    --blue:     #2563eb;
    --amber:    #d97706;
    --red:      #dc2626;
    --text:     #1e2a4a;
    --muted:    #6b7a9f;
    --mono:     'JetBrains Mono', monospace;
    --ui:       'Inter', sans-serif;
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--ui);
    min-height: 100vh;
    background-image:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,168,112,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(37,99,235,0.06) 0%, transparent 60%);
  }

  #root { width: 100%; max-width: 100%; min-height: 100vh; text-align: left; border: none; display: block; }

  .app { max-width: 1080px; margin: 0 auto; padding: 28px 20px 60px; }

  /* ── Header ── */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; margin-bottom: 32px; padding-bottom: 22px;
    border-bottom: 1px solid var(--border);
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .logo {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #00e5a0, #00b87a);
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-weight: 700; font-size: 17px; color: #000;
    box-shadow: 0 0 24px rgba(0,229,160,0.3);
  }
  .header h1 { font-size: 21px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
  .header p  { font-family: var(--mono); font-size: 11px; color: var(--muted); margin-top: 3px; }
  .backend-dot {
    width: 8px; height: 8px; border-radius: 50%;
    display: inline-block; margin-right: 5px; vertical-align: middle;
  }
  .backend-status { font-family: var(--mono); font-size: 11px; color: var(--muted); }

  /* ── Notice ── */
  .notice {
    background: rgba(255,196,107,0.07); border: 1px solid rgba(255,196,107,0.25);
    border-radius: 8px; padding: 10px 16px;
    font-family: var(--mono); font-size: 11px; color: var(--amber);
    margin-bottom: 20px; line-height: 1.65;
  }

  /* ── Controls row ── */
  .controls {
    display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
    margin-bottom: 24px;
    padding: 14px 16px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px;
  }
  .ctrl-group { display: flex; align-items: center; gap: 7px; }
  .ctrl-label {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0;
  }
  .btn {
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); font-family: var(--mono); font-size: 12px;
    padding: 7px 13px; border-radius: 7px; cursor: pointer;
    transition: all .15s; white-space: nowrap;
  }
  .btn:hover  { border-color: var(--green); color: var(--green); }
  .btn.active { background: var(--green); color: #000; border-color: var(--green); font-weight: 700; }
  .btn:disabled { opacity: .4; cursor: not-allowed; }

  .btn-solve {
    background: linear-gradient(135deg, #00e5a0, #00b87a) !important;
    color: #000 !important; font-weight: 700; padding: 8px 22px;
    font-size: 13px; border: none !important;
    box-shadow: 0 0 20px rgba(0,229,160,0.3);
  }
  .btn-solve:hover { box-shadow: 0 0 30px rgba(0,229,160,0.5); transform: translateY(-1px); }
  .btn-solve:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

  .sep { width: 1px; height: 26px; background: var(--border); flex-shrink: 0; }

  /* ── Main layout ── */
  .main-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
  }
  @media (max-width: 680px) { .main-grid { grid-template-columns: 1fr; } }

  /* ── Panel ── */
  .panel {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px;
    transition: border-color .2s;
  }
  .panel.active-panel { border-color: rgba(0,229,160,0.3); box-shadow: 0 0 20px rgba(0,229,160,0.05); }
  .panel.active-panel-blue { border-color: rgba(77,166,255,0.3); box-shadow: 0 0 20px rgba(77,166,255,0.05); }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .panel-title {
    font-family: var(--mono); font-size: 11px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .badge {
    font-family: var(--mono); font-size: 11px;
    padding: 3px 9px; border-radius: 5px; font-weight: 600;
  }
  .badge-green { background: rgba(0,229,160,.1); color: var(--green); border: 1px solid rgba(0,229,160,.3); }
  .badge-blue  { background: rgba(77,166,255,.1); color: var(--blue);  border: 1px solid rgba(77,166,255,.3); }
  .badge-dim   { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
  .badge-red   { background: rgba(255,92,92,.1); color: var(--red); border: 1px solid rgba(255,92,92,.3); }

  /* ── Puzzle wrap ── */
  .puzzle-wrap {
    display: flex; justify-content: center; align-items: center;
    margin-bottom: 16px; min-height: 100px;
  }

  /* ── Stats ── */
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 9px 10px; text-align: center;
  }
  .stat-val { font-family: var(--mono); font-size: 16px; font-weight: 700; }
  .stat-lbl { font-size: 10px; color: var(--muted); margin-top: 3px; font-family: var(--mono); }
  .c-green { color: var(--green); }
  .c-blue  { color: var(--blue); }
  .c-amber { color: var(--amber); }

  /* progress bar */
  .prog-track {
    height: 3px; background: var(--dim); border-radius: 2px;
    margin-top: 12px; overflow: hidden;
  }
  .prog-fill { height: 100%; border-radius: 2px; transition: width .6s ease; }

  /* ── Edit mode hint ── */
  .edit-hint {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    text-align: center; margin-top: 8px;
    padding: 5px 10px; background: var(--surface); border-radius: 6px;
    border: 1px dashed var(--border);
  }
  .edit-hint span { color: var(--amber); }

  /* ── Animation Panel ── */
  .anim-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 16px;
  }
  .anim-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
  }
  .anim-title-wrap { display: flex; align-items: center; gap: 10px; }
  .anim-section-label {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .tab-group { display: flex; gap: 5px; }
  .tab-btn {
    font-family: var(--mono); font-size: 11px; padding: 5px 12px;
    border-radius: 6px; border: 1px solid var(--border);
    background: var(--surface); color: var(--muted); cursor: pointer;
    transition: all .15s;
  }
  .tab-btn:hover  { border-color: var(--green); color: var(--green); }
  .tab-btn.active { border-color: var(--green); color: var(--green); background: rgba(0,229,160,.1); }
  .tab-btn.active-blue { border-color: var(--blue); color: var(--blue); background: rgba(77,166,255,.1); }

  /* step chips */
  .step-scroll { overflow-x: auto; padding-bottom: 4px; margin-bottom: 14px; }
  .step-seq { display: flex; flex-wrap: wrap; gap: 4px; min-height: 28px; }
  .step-chip {
    font-family: var(--mono); font-size: 10px; padding: 3px 8px;
    border-radius: 4px; background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); cursor: pointer; transition: all .12s; flex-shrink: 0;
    white-space: nowrap;
  }
  .step-chip:hover { border-color: var(--green); color: var(--green); }
  .step-chip.cur  { background: rgba(0,229,160,.15); border-color: var(--green); color: var(--green); font-weight: 700; }
  .step-chip.cur-blue { background: rgba(77,166,255,.15); border-color: var(--blue); color: var(--blue); font-weight: 700; }
  .step-chip.done { border-color: var(--dim); color: var(--dim); }

  /* playbar */
  .playbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .playbtn {
    background: var(--surface); border: 1px solid var(--border); color: var(--text);
    width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    transition: all .15s; flex-shrink: 0;
  }
  .playbtn:hover  { border-color: var(--green); color: var(--green); }
  .playbtn.active { background: var(--green); color: #000; border-color: var(--green); }
  .playbtn:disabled { opacity: .35; cursor: not-allowed; }

  .speed-group { display: flex; gap: 4px; margin-left: 4px; }
  .speed-btn {
    font-family: var(--mono); font-size: 10px; padding: 3px 8px;
    border-radius: 5px; border: 1px solid var(--border);
    background: var(--surface); color: var(--muted); cursor: pointer;
    transition: all .12s;
  }
  .speed-btn:hover  { border-color: var(--amber); color: var(--amber); }
  .speed-btn.active { border-color: var(--amber); color: var(--amber); background: rgba(255,196,107,.1); }

  .step-info { font-family: var(--mono); font-size: 11px; color: var(--muted); margin-left: auto; }

  /* ── Chart section ── */
  .chart-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 16px;
  }
  .section-label {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 18px;
  }

  /* ── Empty state ── */
  .empty {
    text-align: center; padding: 32px 20px; color: var(--muted);
    font-family: var(--mono); font-size: 12px; line-height: 1.8;
  }
  .empty-icon { font-size: 28px; margin-bottom: 8px; opacity: .5; }

  /* ── Spinner ── */
  .spinner {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid rgba(0,0,0,.25); border-top-color: #000;
    border-radius: 50%; animation: spin .65s linear infinite; margin-right: 6px;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Input mode toggle ── */
  .mode-toggle {
    display: flex; background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 3px; gap: 3px;
  }
  .mode-btn {
    font-family: var(--mono); font-size: 10px; padding: 4px 10px;
    border-radius: 5px; border: none; background: transparent;
    color: var(--muted); cursor: pointer; transition: all .15s;
  }
  .mode-btn.active { background: var(--card2); color: var(--text); }

  /* ── footer hint ── */
  .footer-hint {
    text-align: center; margin-top: 32px; font-family: var(--mono);
    font-size: 10px; color: var(--muted);
  }
  .footer-hint code {
    background: var(--surface); padding: 2px 6px; border-radius: 4px;
    color: var(--text); font-size: 10px; border: 1px solid var(--border);
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .fade-in { animation: fadeIn .35s ease forwards; }
`;

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  // puzzle state
  const [size, setSize] = useState(3);
  const [diff, setDiff] = useState(25);
  const [tiles, setTiles] = useState(() => shuffleTiles(3, 25));

  // UI mode
  const [editMode, setEditMode] = useState(false); // drag-drop / manual input
  const [loading, setLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(null);

  // solve results
  const [mhResult, setMhResult] = useState(null);
  const [nnResult, setNnResult] = useState(null);
  const [mhPath, setMhPath] = useState([]);
  const [nnPath, setNnPath] = useState([]);

  // animation
  const [animIdx, setAnimIdx] = useState(0);
  const [animWhich, setAnimWhich] = useState("mh"); // "mh" | "nn"
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1× = 350ms
  const playRef = useRef(null);

  // check backend
  useEffect(() => {
    fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) })
      .then(r => r.ok ? setBackendOk(true) : setBackendOk(false))
      .catch(() => setBackendOk(false));
  }, []);

  // ── animation engine ────────────────────────────────────────────────────
  const curPath = animWhich === "mh" ? mhPath : nnPath;
  const msPerFrame = SPEEDS[speedIdx].ms;

  const stopPlay = useCallback(() => {
    setPlaying(false);
    clearInterval(playRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying(prev => {
      if (!prev) {
        clearInterval(playRef.current);
        playRef.current = setInterval(() => {
          setAnimIdx(i => {
            if (i >= curPath.length - 1) {
              clearInterval(playRef.current);
              setPlaying(false);
              return i;
            }
            return i + 1;
          });
        }, msPerFrame);
        return true;
      } else {
        clearInterval(playRef.current);
        return false;
      }
    });
  }, [curPath.length, msPerFrame]);

  // restart interval when speed changes mid-play
  useEffect(() => {
    if (playing) {
      clearInterval(playRef.current);
      playRef.current = setInterval(() => {
        setAnimIdx(i => {
          if (i >= curPath.length - 1) {
            clearInterval(playRef.current);
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, msPerFrame);
    }
  }, [msPerFrame]); // eslint-disable-line

  const stepAnim = (dir) => {
    stopPlay();
    setAnimIdx(i => Math.max(0, Math.min(curPath.length - 1, i + dir)));
  };

  // ── tiles being displayed on each board ─────────────────────────────────
  const curTiles = curPath.length && animIdx < curPath.length ? curPath[animIdx] : tiles;
  const prevTiles = curPath.length && animIdx > 0 ? curPath[animIdx - 1] : null;
  const changedIdxs = prevTiles
    ? curTiles.map((v, i) => (v !== prevTiles[i] ? i : -1)).filter(x => x >= 0)
    : [];

  // ── actions ─────────────────────────────────────────────────────────────
  const clearResults = () => {
    setMhResult(null); setNnResult(null);
    setMhPath([]); setNnPath([]);
    setAnimIdx(0);
  };

  const handleSize = (n) => {
    stopPlay();
    setSize(n);
    setTiles(shuffleTiles(n, diff));
    clearResults();
  };

  const randomize = useCallback(async () => {
    stopPlay();
    clearResults();
    if (backendOk) {
      try {
        const res = await fetch(`${API}/random?size=${size}&difficulty=${diff}`);
        if (res.ok) {
          const data = await res.json();
          setTiles(data.tiles);
          return;
        }
      } catch (_) {}
    }
    setTiles(shuffleTiles(size, diff));
  }, [size, diff, backendOk]); // eslint-disable-line

  const solve = async () => {
    setLoading(true);
    stopPlay();
    setAnimIdx(0);

    try {
      let mhR, nnR;

      if (backendOk) {
        const res = await fetch(`${API}/solve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tiles, size }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        mhR = {
          found: data.manhattan.solved, nodes: data.manhattan.nodes_exp,
          cost: data.manhattan.cost, time_ms: data.manhattan.time_ms,
          path_tiles: data.manhattan.path_tiles,
        };
        nnR = {
          found: data.nn.solved, nodes: data.nn.nodes_exp,
          cost: data.nn.cost, time_ms: data.nn.time_ms,
          path_tiles: data.nn.path_tiles,
        };
      } else {
        // fallback: local JS A*
        const t0 = performance.now();
        const mhLocal = localAstar(tiles, size);
        mhR = { ...mhLocal, time_ms: +(performance.now() - t0).toFixed(1), path_tiles: mhLocal.path };

        const t1 = performance.now();
        const nnLocal = localAstar(tiles, size,
          (t) => Math.max(0, manhattan(t, size) + (Math.random() - 0.5) * 1.2));
        nnR = { ...nnLocal, time_ms: +(performance.now() - t1).toFixed(1), path_tiles: nnLocal.path };
      }

      setMhResult(mhR);
      setNnResult(nnR);
      setMhPath(mhR.path_tiles || []);
      setNnPath(nnR.path_tiles || []);
      setAnimWhich("mh");
      setAnimIdx(0);
    } catch (e) {
      console.error("Solve error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  const panels = [
    { id: "mh", label: "Manhattan Distance", result: mhResult, path: mhPath, color: "green" },
    { id: "nn", label: "NN Heuristic",       result: nnResult, path: nnPath, color: "blue"  },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="app">

        {/* ── Header ── */}
        <div className="header">
          <div className="header-left">
            <div>
              <h1>AI Puzzle Solver</h1>
              <p>Manhattan Distance vs NN Heuristic — so sánh trực tiếp</p>
            </div>
          </div>
          <div className="backend-status">
            <span
              className="backend-dot"
              style={{
                background: backendOk === null ? "#6b7280" : backendOk ? "#00e5a0" : "#ff5c5c",
                boxShadow: backendOk ? "0 0 8px rgba(0,229,160,0.5)" : "none",
              }}
            />
            {backendOk === null ? "Connecting..." : backendOk ? "Backend online" : "Local mode"}
          </div>
        </div>

        {/* ── Notice ── */}
        {backendOk === false && (
          <div className="notice fade-in">
            ⚠ Backend FastAPI chưa chạy → dùng A* JavaScript local (NN là mô phỏng).{" "}
            Chạy: <code>uvicorn api.main:app --reload --port 8000</code> để dùng Python backend thực.
          </div>
        )}

        {/* ── Controls ── */}
        <div className="controls">
          <div className="ctrl-group">
            <span className="ctrl-label">Size</span>
            {[3, 4].map(n => (
              <button
                key={n}
                id={`btn-size-${n}`}
                className={`btn${size === n ? " active" : ""}`}
                onClick={() => handleSize(n)}
              >
                {n}×{n}
              </button>
            ))}
          </div>

          <div className="sep" />

          <div className="ctrl-group">
            <span className="ctrl-label">Độ khó</span>
            {[["Dễ", 15], ["Vừa", 30], ["Khó", 50]].map(([label, d]) => (
              <button
                key={d}
                id={`btn-diff-${d}`}
                className={`btn${diff === d ? " active" : ""}`}
                onClick={() => setDiff(d)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="sep" />

          <div className="ctrl-group">
            <span className="ctrl-label">Mode</span>
            <div className="mode-toggle">
              <button
                className={`mode-btn${!editMode ? " active" : ""}`}
                onClick={() => setEditMode(false)}
                title="Chế độ xem"
              >
                👁 View
              </button>
              <button
                className={`mode-btn${editMode ? " active" : ""}`}
                onClick={() => setEditMode(true)}
                title="Kéo thả / nhập tay"
              >
                ✏️ Edit
              </button>
            </div>
          </div>

          <div className="sep" />

          <button
            id="btn-solve"
            className="btn btn-solve"
            onClick={solve}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" />Solving...</>
              : "▶ Solve"
            }
          </button>

          <button
            id="btn-random"
            className="btn"
            onClick={randomize}
            disabled={loading}
          >
            ↺ Random
          </button>
        </div>

        {/* ── Dual Puzzle Panels ── */}
        <div className="main-grid">
          {panels.map(({ id, label, result, color }) => {
            const isCur = animWhich === id && curPath.length > 0;
            const displayTiles = isCur ? curTiles : tiles;
            const displayChanged = isCur ? changedIdxs : [];
            const panelActive = isCur
              ? (color === "green" ? "panel active-panel" : "panel active-panel-blue")
              : "panel";

            return (
              <div
                key={id}
                id={`panel-${id}`}
                className={panelActive}
              >
                <div className="panel-header">
                  <span className="panel-title">{label}</span>
                  <span
                    className={`badge ${
                      !result ? "badge-dim"
                      : result.found ? (color === "green" ? "badge-green" : "badge-blue")
                      : "badge-red"
                    }`}
                  >
                    {!result ? "–" : result.found ? "✓ solved" : "✗ failed"}
                  </span>
                </div>

                <div className="puzzle-wrap">
                  <PuzzleBoard
                    tiles={displayTiles}
                    size={size}
                    changed={displayChanged}
                    color={color}
                    editable={editMode}
                    onTilesChange={(next) => {
                      setTiles(next);
                      clearResults();
                    }}
                  />
                </div>

                {editMode && (
                  <div className="edit-hint">
                    <span>✦</span> Kéo thả ô · Double-click để nhập số
                  </div>
                )}

                <div className="stats">
                  <div className="stat">
                    <div className={`stat-val c-${color}`}>
                      {result ? result.nodes.toLocaleString() : "–"}
                    </div>
                    <div className="stat-lbl">nodes</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val c-amber">
                      {result ? (result.found ? result.cost : "–") : "–"}
                    </div>
                    <div className="stat-lbl">steps</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val">
                      {result ? `${result.time_ms}ms` : "–"}
                    </div>
                    <div className="stat-lbl">time</div>
                  </div>
                </div>

                <div className="prog-track">
                  <div
                    className="prog-fill"
                    style={{
                      width: result
                        ? (result.found
                          ? isCur
                            ? `${Math.round((animIdx / Math.max(curPath.length - 1, 1)) * 100)}%`
                            : "100%"
                          : "35%")
                        : "0%",
                      background: color === "green" ? "var(--green)" : "var(--blue)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Animation Panel ── */}
        <div className="anim-card">
          <div className="anim-header">
            <div className="anim-title-wrap">
              <span className="anim-section-label">Animation</span>
              <div className="tab-group">
                {panels.map(({ id, label, color }) => (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    className={`tab-btn${animWhich === id ? (color === "blue" ? " active active-blue" : " active") : ""}`}
                    onClick={() => { stopPlay(); setAnimWhich(id); setAnimIdx(0); }}
                  >
                    {id === "mh" ? "Manhattan" : "NN Heuristic"}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed control */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="ctrl-label">Speed</span>
              <div className="speed-group">
                {SPEEDS.map((s, i) => (
                  <button
                    key={i}
                    className={`speed-btn${speedIdx === i ? " active" : ""}`}
                    onClick={() => setSpeedIdx(i)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step chips */}
          <div className="step-scroll">
            <div className="step-seq">
              {curPath.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">⬜</div>
                  Bấm <strong>▶ Solve</strong> để xem animation từng bước
                </div>
              ) : (
                curPath.map((_, i) => {
                  const isCur = i === animIdx;
                  const isDone = i < animIdx;
                  const chipColor = animWhich === "nn" ? "cur-blue" : "cur";
                  return (
                    <span
                      key={i}
                      id={`step-${i}`}
                      className={`step-chip${isCur ? ` ${chipColor}` : isDone ? " done" : ""}`}
                      onClick={() => { stopPlay(); setAnimIdx(i); }}
                    >
                      {i === 0 ? "start" : i === curPath.length - 1 ? "goal" : `#${i}`}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Playbar */}
          <div className="playbar">
            <button
              id="btn-skip-start"
              className="playbtn"
              onClick={() => { stopPlay(); setAnimIdx(0); }}
              disabled={curPath.length === 0}
              title="Về đầu"
            >⏮</button>
            <button
              id="btn-prev"
              className="playbtn"
              onClick={() => stepAnim(-1)}
              disabled={curPath.length === 0 || animIdx === 0}
              title="Bước trước"
            >‹</button>
            <button
              id="btn-play"
              className={`playbtn${playing ? " active" : ""}`}
              onClick={togglePlay}
              disabled={curPath.length === 0}
              title={playing ? "Dừng" : "Phát"}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              id="btn-next"
              className="playbtn"
              onClick={() => stepAnim(1)}
              disabled={curPath.length === 0 || animIdx === curPath.length - 1}
              title="Bước tiếp"
            >›</button>
            <button
              id="btn-skip-end"
              className="playbtn"
              onClick={() => { stopPlay(); setAnimIdx(Math.max(0, curPath.length - 1)); }}
              disabled={curPath.length === 0}
              title="Về cuối"
            >⏭</button>

            <span className="step-info">
              {curPath.length
                ? `bước ${animIdx} / ${curPath.length - 1} · ${animWhich === "mh" ? "Manhattan" : "NN"}`
                : "–"
              }
            </span>
          </div>
        </div>

        {/* ── Chart comparison ── */}
        {mhResult && nnResult && (
          <div className="chart-card fade-in">
            <div className="section-label">So sánh hiệu quả — Manhattan vs NN Heuristic</div>
            <Chart mhResult={mhResult} nnResult={nnResult} />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="footer-hint">
          Backend: <code>uvicorn api.main:app --reload --port 8000</code>
          &nbsp;·&nbsp;
          Frontend: <code>npm run dev</code> trong <code>frontend_app/</code>
        </div>

      </div>
    </>
  );
}
