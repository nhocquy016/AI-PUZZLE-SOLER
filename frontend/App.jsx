/**
 * frontend/src/App.jsx
 * ====================
 * React frontend cho AI Puzzle Solver
 *
 * Cài đặt:
 *   npm create vite@latest frontend -- --template react
 *   cd frontend && npm install
 *   npm run dev
 *
 * Yêu cầu backend FastAPI đang chạy tại localhost:8000
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── CSS inline (có thể tách ra App.css) ───────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #0d0f14;
    --surface: #13161e;
    --card:    #1a1e28;
    --border:  #2a2f3e;
    --dim:     #3a404f;
    --green:   #00e5a0;
    --blue:    #4da6ff;
    --amber:   #ffb347;
    --red:     #ff5c5c;
    --text:    #e8eaf0;
    --muted:   #6b7280;
    --mono:    'JetBrains Mono', monospace;
    --ui:      'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--ui); min-height: 100vh; }

  .app { max-width: 960px; margin: 0 auto; padding: 28px 20px; }

  /* header */
  .header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
  .logo { width: 42px; height: 42px; background: var(--green); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 700; font-size: 18px; color: #000; }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .header p  { font-family: var(--mono); font-size: 11px; color: var(--muted); margin-top: 3px; }

  /* controls */
  .controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 24px; }
  .btn { background: var(--card); border: 1px solid var(--border); color: var(--text); font-family: var(--mono); font-size: 12px; padding: 8px 14px; border-radius: 6px; cursor: pointer; transition: all .15s; }
  .btn:hover { border-color: var(--green); color: var(--green); }
  .btn.active { background: var(--green); color: #000; border-color: var(--green); font-weight: 700; }
  .btn-solve { background: var(--green) !important; color: #000 !important; font-weight: 700; padding: 9px 22px; font-size: 13px; border-color: var(--green) !important; }
  .btn-solve:disabled { opacity: .5; cursor: not-allowed; }
  .sep { width: 1px; height: 28px; background: var(--border); }
  .label { font-family: var(--mono); font-size: 11px; color: var(--muted); }

  /* main panels */
  .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 600px) { .panels { grid-template-columns: 1fr; } }

  .panel { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
  .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .panel-title { font-family: var(--mono); font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
  .badge { font-family: var(--mono); font-size: 11px; padding: 3px 8px; border-radius: 4px; }
  .badge-green { background: rgba(0,229,160,.12); color: var(--green); border: 1px solid rgba(0,229,160,.3); }
  .badge-blue  { background: rgba(77,166,255,.12); color: var(--blue);  border: 1px solid rgba(77,166,255,.3); }

  /* puzzle grid */
  .puzzle-wrap { display: flex; justify-content: center; margin-bottom: 14px; }
  .puzzle-grid { display: grid; gap: 4px; }
  .tile { display: flex; align-items: center; justify-content: center; border-radius: 7px; font-family: var(--mono); font-weight: 700; transition: all .25s cubic-bezier(.34,1.56,.64,1); }
  .tile-num  { background: var(--surface); border: 1px solid var(--border); color: var(--text); }
  .tile-blank { border: 1px dashed var(--dim); }
  .tile-hi   { background: rgba(0,229,160,.15); border: 1px solid var(--green); color: var(--green); }
  .tile-hi-blue { background: rgba(77,166,255,.15); border: 1px solid var(--blue); color: var(--blue); }

  /* stats */
  .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; text-align: center; }
  .stat-val { font-family: var(--mono); font-size: 17px; font-weight: 700; }
  .stat-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; font-family: var(--mono); }
  .c-green { color: var(--green); }
  .c-blue  { color: var(--blue);  }
  .c-amber { color: var(--amber); }

  /* progress */
  .progress { height: 3px; background: var(--dim); border-radius: 2px; margin-top: 12px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }

  /* compare */
  .compare { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 18px; margin-bottom: 16px; }
  .compare-title { font-family: var(--mono); font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
  .compare-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
  .compare-label { font-family: var(--mono); font-size: 11px; color: var(--muted); width: 110px; flex-shrink: 0; }
  .compare-bars { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .bar-row { display: flex; align-items: center; gap: 8px; }
  .bar-name { font-family: var(--mono); font-size: 10px; color: var(--muted); width: 70px; flex-shrink: 0; text-align: right; }
  .bar-track { flex: 1; height: 14px; background: var(--surface); border-radius: 3px; overflow: hidden; border: 1px solid var(--border); }
  .bar-fill { height: 100%; border-radius: 2px; transition: width .6s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 5px; }
  .bar-fill span { font-family: var(--mono); font-size: 9px; font-weight: 700; color: #000; }
  .bar-green { background: var(--green); }
  .bar-blue  { background: var(--blue);  }
  .winner-tag { font-family: var(--mono); font-size: 10px; padding: 2px 7px; border-radius: 10px; background: rgba(0,229,160,.15); color: var(--green); border: 1px solid rgba(0,229,160,.3); margin-left: 8px; }

  /* animation panel */
  .anim-panel { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
  .anim-title { font-family: var(--mono); font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .step-seq { display: flex; flex-wrap: wrap; gap: 4px; min-height: 32px; }
  .step-chip { font-family: var(--mono); font-size: 11px; padding: 3px 8px; border-radius: 4px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); cursor: pointer; transition: all .15s; }
  .step-chip:hover { border-color: var(--green); color: var(--green); }
  .step-chip.cur  { background: rgba(0,229,160,.15); border-color: var(--green); color: var(--green); font-weight: 700; }
  .step-chip.done { border-color: var(--dim); color: var(--dim); }

  .playbar { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
  .playbtn { background: var(--surface); border: 1px solid var(--border); color: var(--text); width: 34px; height: 34px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; font-family: var(--mono); transition: all .15s; }
  .playbtn:hover { border-color: var(--green); color: var(--green); }
  .step-info { font-family: var(--mono); font-size: 11px; color: var(--muted); flex: 1; text-align: right; }
  .tab-btn { font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface); color: var(--muted); cursor: pointer; }
  .tab-btn.active { border-color: var(--green); color: var(--green); }

  .empty { text-align: center; padding: 28px; color: var(--muted); font-family: var(--mono); font-size: 12px; }

  /* loading spinner */
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(0,0,0,.3); border-top-color: #000; border-radius: 50%; animation: spin .7s linear infinite; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* api notice */
  .notice { background: rgba(255,179,71,.08); border: 1px solid rgba(255,179,71,.3); border-radius: 8px; padding: 10px 14px; font-family: var(--mono); font-size: 11px; color: var(--amber); margin-bottom: 16px; line-height: 1.6; }
`;

// ── helpers ───────────────────────────────────────────────────────────────

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

// local A* (fallback nếu không có backend)
const localAstar = (startTiles, n, hFn = null) => {
  const goal = makeGoal(n);
  const goalKey = goal.join(",");
  const h = hFn || ((t) => manhattan(t, n));
  const heap = [[h(startTiles), 0, startTiles, [startTiles]]];
  const visited = new Set();
  const gcost = { [startTiles.join(",")]: 0 };
  let nodesExp = 0;
  const MAX = n === 3 ? 100000 : 30000;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (heap.length && nodesExp < MAX) {
    heap.sort((a, b) => a[0] - b[0]);
    const [, g, tiles, path] = heap.shift();
    const key = tiles.join(",");
    if (visited.has(key)) continue;
    visited.add(key); nodesExp++;
    if (key === goalKey) return { found: true, path, nodes: nodesExp, cost: path.length - 1, time_ms: 0 };
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
  return { found: false, path: [], nodes: nodesExp, cost: -1, time_ms: 0 };
};

const shuffle = (n, steps) => {
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

// ── PuzzleGrid component ──────────────────────────────────────────────────

function PuzzleGrid({ tiles, size, changed = [], color = "green" }) {
  const tileSize = size === 3 ? 72 : 52;
  const fontSize = size === 3 ? 22 : 16;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${size}, ${tileSize}px)`, gap: 4 }}>
      {tiles.map((v, i) => {
        const isChanged = changed.includes(i);
        const cls = v === 0
          ? "tile tile-blank"
          : isChanged
            ? (color === "blue" ? "tile tile-hi-blue" : "tile tile-hi")
            : "tile tile-num";
        return (
          <div key={i} className={cls}
            style={{ width: tileSize, height: tileSize, fontSize }}>
            {v || ""}
          </div>
        );
      })}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [size, setSize] = useState(3);
  const [diff, setDiff] = useState(25);
  const [tiles, setTiles] = useState(() => shuffle(3, 25));
  const [loading, setLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  const [backendOk, setBackendOk] = useState(null);

  const [mhResult, setMhResult] = useState(null);
  const [nnResult, setNnResult] = useState(null);
  const [mhPath, setMhPath] = useState([]);
  const [nnPath, setNnPath] = useState([]);

  const [animIdx, setAnimIdx] = useState(0);
  const [animWhich, setAnimWhich] = useState("mh");
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  // kiểm tra backend khi load
  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then(r => r.ok ? setBackendOk(true) : setBackendOk(false))
      .catch(() => setBackendOk(false));
  }, []);

  const randomize = useCallback(() => {
    stopPlay();
    setTiles(shuffle(size, diff));
    setMhResult(null); setNnResult(null);
    setMhPath([]); setNnPath([]);
    setAnimIdx(0);
  }, [size, diff]);

  const handleSize = (n) => { setSize(n); setTiles(shuffle(n, diff)); setMhResult(null); setNnResult(null); setMhPath([]); setNnPath([]); };

  const solve = async () => {
    setLoading(true);
    stopPlay(); setAnimIdx(0);

    try {
      let mhR, nnR;

      if (useBackend && backendOk) {
        // gọi API backend Python (A* thực)
        const res = await fetch("http://localhost:8000/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tiles, size }),
        });
        const data = await res.json();
        mhR = { found: data.manhattan.solved, nodes: data.manhattan.nodes_exp, cost: data.manhattan.cost, time_ms: data.manhattan.time_ms, path_tiles: data.manhattan.path_tiles };
        nnR = { found: data.nn.solved,       nodes: data.nn.nodes_exp,       cost: data.nn.cost,       time_ms: data.nn.time_ms,       path_tiles: data.nn.path_tiles };
      } else {
        // fallback: local JS A*
        const t0 = performance.now();
        const mhLocal = localAstar(tiles, size);
        mhR = { ...mhLocal, time_ms: +(performance.now() - t0).toFixed(1), path_tiles: mhLocal.path };

        const t1 = performance.now();
        const nnLocal = localAstar(tiles, size, (t) => Math.max(0, manhattan(t, size) + (Math.random() - 0.5) * 1.5));
        nnR = { ...nnLocal, time_ms: +(performance.now() - t1).toFixed(1), path_tiles: nnLocal.path };
      }

      setMhResult(mhR); setNnResult(nnR);
      setMhPath(mhR.path_tiles || []); setNnPath(nnR.path_tiles || []);
      setAnimWhich("mh"); setAnimIdx(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // animation
  const curPath = animWhich === "mh" ? mhPath : nnPath;

  const stepAnim = (dir) => {
    setAnimIdx(i => Math.max(0, Math.min(curPath.length - 1, i + dir)));
  };

  const stopPlay = () => { setPlaying(false); clearInterval(playRef.current); };
  const togglePlay = () => {
    setPlaying(p => {
      if (!p) {
        playRef.current = setInterval(() => {
          setAnimIdx(i => {
            if (i >= curPath.length - 1) { clearInterval(playRef.current); setPlaying(false); return i; }
            return i + 1;
          });
        }, 350);
        return true;
      } else {
        clearInterval(playRef.current); return false;
      }
    });
  };

  const curTiles = curPath.length && animIdx < curPath.length ? curPath[animIdx] : tiles;
  const prevTiles = curPath.length && animIdx > 0 ? curPath[animIdx - 1] : null;
  const changed = prevTiles ? curTiles.map((v, i) => v !== prevTiles[i] ? i : -1).filter(x => x >= 0) : [];

  const mhNodes = mhResult?.nodes ?? 0;
  const nnNodes = nnResult?.nodes ?? 0;
  const maxN = Math.max(mhNodes, nnNodes, 1);
  const mhSteps = mhResult?.cost ?? 0;
  const nnSteps = nnResult?.cost ?? 0;
  const maxS = Math.max(mhSteps, nnSteps, 1);

  const mhWinNodes = mhNodes > 0 && mhNodes <= nnNodes;
  const nnWinNodes = nnNodes > 0 && nnNodes < mhNodes;

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header">
          <div className="logo">A*</div>
          <div>
            <h1>AI Puzzle Solver</h1>
            <p>Manhattan Distance vs NN Heuristic — so sánh trực tiếp</p>
          </div>
        </div>

        {backendOk === false && (
          <div className="notice">
            ⚠ Backend (FastAPI) chưa chạy → đang dùng A* JavaScript local (NN heuristic là giả lập).<br />
            Chạy: <code>uvicorn api.main:app --reload --port 8000</code> để kết nối Python backend thực.
          </div>
        )}

        <div className="controls">
          <span className="label">SIZE:</span>
          <button className={`btn${size === 3 ? " active" : ""}`} onClick={() => handleSize(3)}>3×3</button>
          <button className={`btn${size === 4 ? " active" : ""}`} onClick={() => handleSize(4)}>4×4</button>
          <div className="sep" />
          <span className="label">DIFF:</span>
          {[["Easy", 15], ["Medium", 30], ["Hard", 50]].map(([label, d]) => (
            <button key={d} className={`btn${diff === d ? " active" : ""}`} onClick={() => setDiff(d)}>{label}</button>
          ))}
          <div className="sep" />
          <button className="btn btn-solve" onClick={solve} disabled={loading}>
            {loading ? <><span className="spinner" />Solving...</> : "▶ Solve"}
          </button>
          <button className="btn" onClick={randomize}>↺ Random</button>
        </div>

        <div className="panels">
          {[
            { id: "mh", label: "Manhattan Distance", result: mhResult, color: "green", badgeCls: "badge-green" },
            { id: "nn", label: "NN Heuristic",       result: nnResult, color: "blue",  badgeCls: "badge-blue"  },
          ].map(({ id, label, result, color, badgeCls }) => {
            const isCur = animWhich === id && curPath.length > 0;
            const displayTiles = isCur ? curTiles : tiles;
            const displayChanged = isCur ? changed : [];
            return (
              <div key={id} className="panel">
                <div className="panel-header">
                  <span className="panel-title">{label}</span>
                  <span className={`badge ${badgeCls}`}>
                    {result ? (result.found ? "✓ solved" : "✗ failed") : "–"}
                  </span>
                </div>
                <div className="puzzle-wrap">
                  <PuzzleGrid tiles={displayTiles} size={size} changed={displayChanged} color={color} />
                </div>
                <div className="stats">
                  <div className="stat">
                    <div className={`stat-val c-${color}`}>{result ? result.nodes.toLocaleString() : "–"}</div>
                    <div className="stat-lbl">nodes</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val c-amber">{result ? (result.found ? result.cost : "–") : "–"}</div>
                    <div className="stat-lbl">steps</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val">{result ? result.time_ms + "ms" : "–"}</div>
                    <div className="stat-lbl">time</div>
                  </div>
                </div>
                <div className="progress">
                  <div className={`progress-fill`}
                    style={{ width: result ? (result.found ? "100%" : "40%") : "0%", background: `var(--${color})` }} />
                </div>
              </div>
            );
          })}
        </div>

        {mhResult && nnResult && (
          <div className="compare">
            <div className="compare-title">So sánh hiệu quả</div>
            {[
              { label: "Nodes mở rộng", mhV: mhNodes, nnV: nnNodes, maxV: maxN },
              { label: "Số bước đi",    mhV: mhSteps, nnV: nnSteps, maxV: maxS },
            ].map(({ label, mhV, nnV, maxV }) => (
              <div className="compare-row" key={label}>
                <div className="compare-label">{label}</div>
                <div className="compare-bars">
                  {[["Manhattan", mhV, "bar-green"], ["NN", nnV, "bar-blue"]].map(([name, val, cls]) => (
                    <div className="bar-row" key={name}>
                      <div className="bar-name">{name}</div>
                      <div className="bar-track">
                        <div className={`bar-fill ${cls}`} style={{ width: Math.round(val / maxV * 100) + "%" }}>
                          <span>{val.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {nnWinNodes && label === "Nodes mở rộng" && <span className="winner-tag">NN wins</span>}
                {mhWinNodes && label === "Nodes mở rộng" && <span className="winner-tag" style={{ color: "var(--green)" }}>MH wins</span>}
              </div>
            ))}
          </div>
        )}

        <div className="anim-panel">
          <div className="anim-title">
            Animation — &nbsp;
            {["mh", "nn"].map(w => (
              <button key={w} className={`tab-btn${animWhich === w ? " active" : ""}`}
                onClick={() => { setAnimWhich(w); setAnimIdx(0); }}
                style={{ marginRight: 6 }}>
                {w === "mh" ? "Manhattan" : "NN Heuristic"}
              </button>
            ))}
          </div>

          <div className="step-seq">
            {curPath.length === 0
              ? <div className="empty">Bấm Solve để xem animation từng bước</div>
              : curPath.map((_, i) => (
                <span key={i} className={`step-chip${i === animIdx ? " cur" : i < animIdx ? " done" : ""}`}
                  onClick={() => setAnimIdx(i)}>
                  {i === 0 ? "start" : i === curPath.length - 1 ? "goal" : `#${i}`}
                </span>
              ))
            }
          </div>

          <div className="playbar">
            <button className="playbtn" onClick={() => stepAnim(-1)}>‹</button>
            <button className="playbtn" onClick={togglePlay}>{playing ? "⏸" : "▶"}</button>
            <button className="playbtn" onClick={() => stepAnim(1)}>›</button>
            <button className="playbtn" onClick={() => setAnimIdx(0)}>⏮</button>
            <button className="playbtn" onClick={() => setAnimIdx(curPath.length - 1)}>⏭</button>
            <span className="step-info">
              {curPath.length ? `bước ${animIdx} / ${curPath.length - 1}` : "–"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
