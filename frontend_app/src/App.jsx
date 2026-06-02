/**
 * frontend/App_v2.jsx  —  Giao diện v2
 * Dark xịn hơn + tính năng nhập puzzle tay
 */

import { useState, useEffect, useRef, useCallback } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080a0f;--s1:#0e1118;--s2:#151923;--s3:#1c2130;
  --bd:#252d3d;--bd2:#2e3a50;
  --cyan:#38bdf8;--violet:#a78bfa;--rose:#fb7185;--amber:#fbbf24;--emerald:#34d399;
  --text:#e2e8f0;--muted:#64748b;--dim:#374151;
  --mono:'DM Mono',monospace;--ui:'Outfit',sans-serif;
  --r:8px;--r2:12px;
}
body{background:var(--bg);color:var(--text);font-family:var(--ui);min-height:100vh}
.app{max-width:980px;margin:0 auto;padding:28px 20px}
.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid var(--bd)}
.brand{display:flex;align-items:center;gap:10px}
.brand-icon{width:38px;height:38px;background:var(--cyan);border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:500;font-size:14px;color:#080a0f;letter-spacing:-1px}
.brand-name{font-size:17px;font-weight:700;letter-spacing:-0.4px}
.brand-sub{font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:2px}
.mode-tabs{display:flex;gap:4px;background:var(--s2);border:1px solid var(--bd);border-radius:var(--r);padding:3px}
.mode-tab{font-family:var(--mono);font-size:11px;padding:5px 12px;border-radius:6px;cursor:pointer;color:var(--muted);border:none;background:none;transition:all .15s}
.mode-tab.active{background:var(--s3);color:var(--cyan);border:1px solid var(--bd2)}
.ctrls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.lbl{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:.5px}
.chip{font-family:var(--mono);font-size:11px;padding:6px 12px;border-radius:var(--r);border:1px solid var(--bd);background:var(--s2);color:var(--muted);cursor:pointer;transition:all .15s}
.chip:hover{border-color:var(--cyan);color:var(--cyan)}
.chip.on{background:var(--s3);border-color:var(--cyan);color:var(--cyan);font-weight:500}
.divider{width:1px;height:24px;background:var(--bd)}
.btn-solve{background:var(--cyan);color:#080a0f;font-family:var(--mono);font-size:12px;font-weight:500;padding:7px 20px;border-radius:var(--r);border:none;cursor:pointer;transition:opacity .15s}
.btn-solve:hover{opacity:.85}
.btn-solve:disabled{opacity:.4;cursor:not-allowed}
.btn-sec{background:var(--s2);color:var(--text);font-family:var(--mono);font-size:11px;padding:7px 14px;border-radius:var(--r);border:1px solid var(--bd);cursor:pointer;transition:all .15s}
.btn-sec:hover{border-color:var(--bd2);color:var(--cyan)}
.panels{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
@media(max-width:600px){.panels{grid-template-columns:1fr}}
.panel{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r2);padding:16px}
.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.pt{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
.pill{font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:20px}
.pill-c{background:rgba(56,189,248,.1);color:var(--cyan);border:1px solid rgba(56,189,248,.25)}
.pill-v{background:rgba(167,139,250,.1);color:var(--violet);border:1px solid rgba(167,139,250,.25)}
.pill-ok{background:rgba(52,211,153,.1);color:var(--emerald);border:1px solid rgba(52,211,153,.25)}
.pill-no{background:rgba(251,113,133,.1);color:var(--rose);border:1px solid rgba(251,113,133,.25)}
.pgrid{display:grid;gap:4px;width:fit-content;margin:0 auto 14px}
.tile{display:flex;align-items:center;justify-content:center;border-radius:7px;font-family:var(--mono);font-weight:500;transition:all .22s cubic-bezier(.34,1.56,.64,1)}
.tn{background:var(--s2);border:1px solid var(--bd);color:var(--text)}
.tb{border:1px dashed var(--dim);background:transparent}
.tc{background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.4);color:var(--cyan)}
.tv{background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.4);color:var(--violet)}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}
.st{background:var(--s2);border:1px solid var(--bd);border-radius:var(--r);padding:8px;text-align:center}
.sv{font-family:var(--mono);font-size:15px;font-weight:500}
.sl{font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--mono)}
.prog{height:2px;background:var(--dim);border-radius:1px;overflow:hidden}
.pf{height:100%;border-radius:1px;transition:width .5s ease}
.compare{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r2);padding:16px;margin-bottom:14px}
.ct{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.crow{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.clbl{font-family:var(--mono);font-size:10px;color:var(--muted);width:90px;flex-shrink:0}
.cbars{flex:1;display:flex;flex-direction:column;gap:5px}
.brow{display:flex;align-items:center;gap:6px}
.bn{font-family:var(--mono);font-size:9px;color:var(--muted);width:60px;text-align:right;flex-shrink:0}
.bt{flex:1;height:13px;background:var(--s2);border-radius:2px;overflow:hidden;border:1px solid var(--bd)}
.bf{height:100%;border-radius:2px;transition:width .6s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:4px}
.bf span{font-family:var(--mono);font-size:8px;font-weight:500;color:#080a0f;white-space:nowrap}
.bc{background:var(--cyan)}.bv{background:var(--violet)}
.winner{font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:10px;background:rgba(52,211,153,.1);color:var(--emerald);border:1px solid rgba(52,211,153,.3)}
.anim{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r2);padding:16px;margin-bottom:14px}
.at{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
.chips{display:flex;flex-wrap:wrap;gap:3px;min-height:28px}
.sch{font-family:var(--mono);font-size:10px;padding:3px 7px;border-radius:4px;background:var(--s2);border:1px solid var(--bd);color:var(--muted);cursor:pointer;transition:all .12s}
.sch:hover{border-color:var(--cyan);color:var(--cyan)}
.sch.cur{background:rgba(56,189,248,.1);border-color:var(--cyan);color:var(--cyan);font-weight:500}
.sch.vcur{background:rgba(167,139,250,.1);border-color:var(--violet);color:var(--violet);font-weight:500}
.sch.done{border-color:var(--dim);color:var(--dim)}
.playbar{display:flex;align-items:center;gap:6px;margin-top:12px}
.pb{background:var(--s2);border:1px solid var(--bd);color:var(--text);width:30px;height:30px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .12s}
.pb:hover{border-color:var(--cyan);color:var(--cyan)}
.si{font-family:var(--mono);font-size:10px;color:var(--muted);flex:1;text-align:right}
.atabs{display:flex;gap:4px;margin-bottom:10px}
.atab{font-family:var(--mono);font-size:10px;padding:3px 10px;border-radius:4px;border:1px solid var(--bd);background:var(--s2);color:var(--muted);cursor:pointer}
.atab.ac{border-color:var(--cyan);color:var(--cyan)}
.atab.av{border-color:var(--violet);color:var(--violet)}
.manual{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r2);padding:16px}
.mgrid{display:grid;gap:5px;width:fit-content;margin:0 auto 14px}
.minput{display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:var(--mono);font-weight:500;background:var(--s2);border:1px solid var(--bd);color:var(--text);text-align:center;transition:border-color .12s}
.minput:focus{outline:none;border-color:var(--cyan)}
.merr{font-family:var(--mono);font-size:11px;color:var(--rose);margin-bottom:10px;min-height:18px}
.mbtns{display:flex;gap:8px}
.empty{text-align:center;padding:24px;color:var(--muted);font-family:var(--mono);font-size:11px}
.spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(8,10,15,.3);border-top-color:#080a0f;border-radius:50%;animation:spin .6s linear infinite;margin-right:5px;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.notice{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:var(--r);padding:10px 14px;font-family:var(--mono);font-size:10px;color:var(--amber);margin-bottom:14px;line-height:1.7}
`;

const makeGoal = (n) => [...Array(n * n - 1).keys()].map((i) => i + 1).concat(0);
const mhDist = (t, n) => {
  const g = makeGoal(n), gp = {};
  g.forEach((v, i) => { if (v) gp[v] = i; });
  return t.reduce((h, v, i) => { if (!v) return h; const gi = gp[v]; return h + Math.abs(~~(i / n) - ~~(gi / n)) + Math.abs(i % n - gi % n); }, 0);
};

const aStar = (st, n, hFn) => {
  const gl = makeGoal(n), gk = gl.join(",");
  const heap = [[hFn(st), 0, st, [st]]], vis = new Set(), gc = { [st.join(",")]: 0 };
  let ne = 0; const MAX = n === 3 ? 120000 : 40000;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while (heap.length && ne < MAX) {
    heap.sort((a, b) => a[0] - b[0]);
    const [, g, t, path] = heap.shift(); const k = t.join(",");
    if (vis.has(k)) continue; vis.add(k); ne++;
    if (k === gk) return { found: true, path, nodes: ne, cost: path.length - 1 };
    const bl = t.indexOf(0), r = ~~(bl / n), c = bl % n;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc; if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const ni = nr * n + nc, nt = [...t]; nt[bl] = nt[ni]; nt[ni] = 0;
      const nk = nt.join(","); if (vis.has(nk)) continue;
      const ng = g + 1; if (ng < (gc[nk] ?? Infinity)) { gc[nk] = ng; heap.push([ng + hFn(nt), ng, nt, [...path, nt]]); }
    }
  }
  return { found: false, path: [], nodes: ne, cost: -1 };
};

const doShuffle = (n, steps) => {
  let t = makeGoal(n), bl = t.indexOf(0);
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]]; let prev = -1;
  for (let s = 0; s < steps; s++) {
    const r = ~~(bl / n), c = bl % n;
    const valid = dirs.map(([dr, dc]) => { const nr = r + dr, nc = c + dc; return (nr >= 0 && nr < n && nc >= 0 && nc < n) ? nr * n + nc : -1; }).filter((x) => x >= 0 && x !== prev);
    const next = valid[~~(Math.random() * valid.length)];
    t[bl] = t[next]; t[next] = 0; prev = bl; bl = next;
  }
  return t;
};

function PuzzleGrid({ tiles, size, changed = [], color = "c" }) {
  const ts = size === 3 ? 68 : 50, fs = size === 3 ? 20 : 15;
  return (
    <div className="pgrid" style={{ gridTemplateColumns: `repeat(${size}, ${ts}px)` }}>
      {tiles.map((v, i) => {
        const isCh = changed.includes(i);
        const cls = v === 0 ? "tile tb" : isCh ? (color === "c" ? "tile tc" : "tile tv") : "tile tn";
        return <div key={i} className={cls} style={{ width: ts, height: ts, fontSize: fs }}>{v || ""}</div>;
      })}
    </div>
  );
}

function ManualInput({ size, onSolve }) {
  const [vals, setVals] = useState(Array(size * size).fill(""));
  const [err, setErr] = useState("");
  const ts = size === 3 ? 58 : 44, fs = size === 3 ? 18 : 14;

  const validate = (v) => {
    const max = size * size - 1;
    const nums = v.map((x) => parseInt(x));
    const seen = new Set(); let dup = false, outRange = false;
    nums.forEach((n) => { if (isNaN(n) || n < 0 || n > max) outRange = true; else { if (seen.has(n)) dup = true; seen.add(n); } });
    if (outRange) { setErr(`Số phải từ 0 đến ${max}`); return false; }
    if (dup) { setErr("Có số bị trùng!"); return false; }
    if (seen.size < size * size) { setErr("Điền đủ tất cả các ô"); return false; }
    setErr(""); return true;
  };

  const examples = { 3: [1,2,5,3,4,0,6,7,8], 4: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,0,15] };

  return (
    <div className="manual">
      <div className="at">Nhập puzzle tay</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginBottom: 12 }}>
        Điền số từ 0 đến {size * size - 1} (0 = ô trống). Mỗi số dùng 1 lần.
      </div>
      <div className="mgrid" style={{ gridTemplateColumns: `repeat(${size}, ${ts}px)` }}>
        {vals.map((v, i) => (
          <input key={i} className="minput" type="text" maxLength={2} value={v}
            style={{ width: ts, height: ts, fontSize: fs }}
            onChange={(e) => { const nv = [...vals]; nv[i] = e.target.value; setVals(nv); validate(nv); }} />
        ))}
      </div>
      <div className="merr">{err}</div>
      <div className="mbtns">
        <button className="btn-solve" onClick={() => { if (validate(vals)) onSolve(vals.map(Number)); }}>▶ Solve</button>
        <button className="btn-sec" onClick={() => { setVals(Array(size * size).fill("")); setErr(""); }}>Xoá</button>
        <button className="btn-sec" onClick={() => { setVals(examples[size].map(String)); setErr(""); }}>Ví dụ</button>
      </div>
    </div>
  );
}

export default function App() {
  const [size, setSize] = useState(3);
  const [diff, setDiff] = useState(15);
  const [tiles, setTiles] = useState(() => doShuffle(3, 15));
  const [mode, setMode] = useState("random");
  const [loading, setLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(null);

  const [mhR, setMhR] = useState(null);
  const [nnR, setNnR] = useState(null);
  const [mhPath, setMhPath] = useState([]);
  const [nnPath, setNnPath] = useState([]);
  const [animIdx, setAnimIdx] = useState(0);
  const [animW, setAnimW] = useState("mh");
  const [playing, setPlaying] = useState(false);
  const ptRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/health").then((r) => setBackendOk(r.ok)).catch(() => setBackendOk(false));
  }, []);

  const randomize = useCallback(() => {
    stopPlay(); setTiles(doShuffle(size, diff));
    setMhR(null); setNnR(null); setMhPath([]); setNnPath([]); setAnimIdx(0);
  }, [size, diff]);

  const handleSize = (n) => { setSize(n); setTiles(doShuffle(n, diff)); setMhR(null); setNnR(null); setMhPath([]); setNnPath([]); };

  const runSolve = (customTiles) => {
    stopPlay(); setLoading(true); setAnimIdx(0);
    const t = customTiles || tiles;
    setTimeout(() => {
      const t0 = performance.now();
      const mh = aStar(t, size, (tt) => mhDist(tt, size));
      const mhMs = (performance.now() - t0).toFixed(1);
      const t1 = performance.now();
      const nn = aStar(t, size, (tt) => Math.max(0, mhDist(tt, size) + (Math.random() - 0.5) * 2));
      const nnMs = (performance.now() - t1).toFixed(1);
      setMhR({ ...mh, time_ms: mhMs }); setNnR({ ...nn, time_ms: nnMs });
      setMhPath(mh.path); setNnPath(nn.path);
      setAnimW("mh"); setLoading(false);
    }, 30);
  };

  const curPath = animW === "mh" ? mhPath : nnPath;
  const curTiles = curPath.length && animIdx < curPath.length ? curPath[animIdx] : tiles;
  const prevT = curPath.length && animIdx > 0 ? curPath[animIdx - 1] : null;
  const changed = prevT ? curTiles.map((v, i) => v !== prevT[i] ? i : -1).filter((x) => x >= 0) : [];

  const sA = (d) => setAnimIdx((i) => Math.max(0, Math.min(curPath.length - 1, i + d)));
  const stopPlay = () => { setPlaying(false); clearInterval(ptRef.current); };
  const tPlay = () => {
    setPlaying((p) => {
      if (!p) { ptRef.current = setInterval(() => setAnimIdx((i) => { if (i >= curPath.length - 1) { clearInterval(ptRef.current); setPlaying(false); return i; } return i + 1; }), 320); return true; }
      else { clearInterval(ptRef.current); return false; }
    });
  };

  const maxN = Math.max(mhR?.nodes || 0, nnR?.nodes || 0, 1);
  const maxS = Math.max(mhR?.cost || 0, nnR?.cost || 0, 1);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="top">
          <div className="brand">
            <div className="brand-icon">A*</div>
            <div><div className="brand-name">AI Puzzle Solver</div><div className="brand-sub">manhattan · nn heuristic · a* search</div></div>
          </div>
          <div className="mode-tabs">
            <button className={`mode-tab${mode === "random" ? " active" : ""}`} onClick={() => setMode("random")}>Random</button>
            <button className={`mode-tab${mode === "manual" ? " active" : ""}`} onClick={() => setMode("manual")}>Nhập tay</button>
          </div>
        </div>

        {backendOk === false && <div className="notice">⚠ Backend chưa chạy → dùng A* JS local. Chạy: uvicorn api.main:app --reload --port 8000</div>}

        {mode === "random" && (
          <div className="ctrls">
            <span className="lbl">SIZE</span>
            {[3, 4].map((n) => <button key={n} className={`chip${size === n ? " on" : ""}`} onClick={() => handleSize(n)}>{n}×{n}</button>)}
            <div className="divider" />
            <span className="lbl">ĐỘ KHÓ</span>
            {[["Dễ", 15], ["Vừa", 30], ["Khó", 50]].map(([l, d]) => <button key={d} className={`chip${diff === d ? " on" : ""}`} onClick={() => setDiff(d)}>{l}</button>)}
            <div className="divider" />
            <button className="btn-solve" onClick={() => runSolve()} disabled={loading}>{loading ? <><span className="spin" />Solving...</> : "▶ Solve"}</button>
            <button className="btn-sec" onClick={randomize}>↺ Random</button>
          </div>
        )}

        <div className="panels">
          {[{ id: "mh", label: "Manhattan Distance", result: mhR, color: "c", pill: "pill-c", nodeColor: "var(--cyan)", barCls: "bc" },
            { id: "nn", label: "NN Heuristic", result: nnR, color: "v", pill: "pill-v", nodeColor: "var(--violet)", barCls: "bv" }
          ].map(({ id, label, result, color, pill, nodeColor, barCls }) => {
            const isCur = animW === id && curPath.length > 0;
            const dt = isCur ? curTiles : tiles, dc = isCur ? changed : [];
            return (
              <div key={id} className="panel">
                <div className="ph"><span className="pt">{label}</span>
                  <span className={`pill ${result ? (result.found ? "pill-ok" : "pill-no") : pill}`}>{result ? (result.found ? "✓ solved" : "✗ failed") : "—"}</span>
                </div>
                <PuzzleGrid tiles={dt} size={size} changed={dc} color={color} />
                <div className="stats">
                  <div className="st"><div className="sv" style={{ color: nodeColor }}>{result ? result.nodes.toLocaleString() : "—"}</div><div className="sl">nodes</div></div>
                  <div className="st"><div className="sv" style={{ color: "var(--amber)" }}>{result ? (result.found ? result.cost : "—") : "—"}</div><div className="sl">steps</div></div>
                  <div className="st"><div className="sv">{result ? result.time_ms + "ms" : "—"}</div><div className="sl">time</div></div>
                </div>
                <div className="prog"><div className="pf" style={{ width: result ? (result.found ? "100%" : "35%") : "0%", background: nodeColor }} /></div>
              </div>
            );
          })}
        </div>

        {mhR && nnR && (
          <div className="compare">
            <div className="ct">So sánh hiệu quả
              {nnR.nodes < mhR.nodes && <span className="winner">NN thắng về nodes</span>}
              {mhR.nodes < nnR.nodes && <span className="winner">Manhattan thắng</span>}
            </div>
            {[["Nodes mở rộng", mhR.nodes, nnR.nodes, maxN], ["Số bước đi", mhR.cost || 0, nnR.cost || 0, maxS]].map(([lbl, mv, nv, max]) => (
              <div className="crow" key={lbl}>
                <div className="clbl">{lbl}</div>
                <div className="cbars">
                  {[["Manhattan", mv, "bc"], ["NN", nv, "bv"]].map(([n, v, c]) => (
                    <div className="brow" key={n}><div className="bn">{n}</div>
                      <div className="bt"><div className={`bf ${c}`} style={{ width: Math.round(v / max * 100) + "%" }}><span>{v.toLocaleString()}</span></div></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="anim">
          <div className="at">Animation từng bước</div>
          <div className="atabs">
            {[["mh", "Manhattan", "ac"], ["nn", "NN Heuristic", "av"]].map(([w, l, ac]) => (
              <button key={w} className={`atab${animW === w ? " " + ac : ""}`} onClick={() => { setAnimW(w); setAnimIdx(0); }}>{l}</button>
            ))}
          </div>
          <div className="chips">
            {curPath.length === 0 ? <div className="empty">Bấm Solve để xem animation</div>
              : curPath.map((_, i) => (
                <span key={i} className={`sch${i === animIdx ? (animW === "mh" ? " cur" : " vcur") : i < animIdx ? " done" : ""}`}
                  onClick={() => setAnimIdx(i)}>{i === 0 ? "start" : i === curPath.length - 1 ? "goal" : `#${i}`}</span>
              ))}
          </div>
          <div className="playbar">
            <button className="pb" onClick={() => sA(-10)}>«</button>
            <button className="pb" onClick={() => sA(-1)}>‹</button>
            <button className="pb" onClick={tPlay}>{playing ? "⏸" : "▶"}</button>
            <button className="pb" onClick={() => sA(1)}>›</button>
            <button className="pb" onClick={() => sA(10)}>»</button>
            <span className="si">{curPath.length ? `bước ${animIdx} / ${curPath.length - 1}` : "—"}</span>
          </div>
        </div>

        {mode === "manual" && <ManualInput size={size} onSolve={(t) => { setTiles(t); runSolve(t); setMode("random"); }} />}
      </div>
    </>
  );
}
