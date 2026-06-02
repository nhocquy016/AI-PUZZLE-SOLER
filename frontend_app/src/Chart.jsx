/**
 * Chart.jsx
 * =========
 * So sánh trực quan hiệu quả giải puzzle: Manhattan vs NN Heuristic
 *
 * Props:
 *   mhResult  – { nodes, cost, time_ms, found }
 *   nnResult  – { nodes, cost, time_ms, found }
 */

import { useEffect, useRef } from "react";

// ── AnimatedBar ────────────────────────────────────────────────────────────
function AnimatedBar({ label, value, maxValue, color, accentRgb, pct }) {
  const barRef = useRef(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = "0%";
    const raf = requestAnimationFrame(() => {
      el.style.transition = "width 0.75s cubic-bezier(0.4,0,0.2,1)";
      el.style.width = pct + "%";
    });
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 80,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#6b7280",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 18,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
        }}
      >
        <div
          ref={barRef}
          style={{
            height: "100%",
            background: color,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 6,
            boxShadow: `0 0 12px rgba(${accentRgb},0.35)`,
            minWidth: pct > 2 ? undefined : 0,
          }}
        >
          {pct > 12 && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(0,0,0,0.75)",
                whiteSpace: "nowrap",
              }}
            >
              {value.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          width: 70,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#c8ccd6",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ── RadialGauge – small SVG circle showing relative efficiency ─────────────
function RadialGauge({ pct, color, label, sublabel }) {
  const R = 30;
  const circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;
  const gaugeRef = useRef(null);

  useEffect(() => {
    const el = gaugeRef.current;
    if (!el) return;
    el.style.strokeDashoffset = circ;
    const raf = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)";
      el.style.strokeDashoffset = circ - dash;
    });
    return () => cancelAnimationFrame(raf);
  }, [pct, circ, dash]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        {/* track */}
        <circle
          cx={40}
          cy={40}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={7}
        />
        {/* fill */}
        <circle
          ref={gaugeRef}
          cx={40}
          cy={40}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          transform="rotate(-90 40 40)"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        {/* center text */}
        <text
          x={40}
          y={37}
          textAnchor="middle"
          fill="#e8eaf0"
          fontSize={12}
          fontWeight={700}
          fontFamily="'JetBrains Mono', monospace"
        >
          {Math.round(pct)}%
        </text>
        <text
          x={40}
          y={51}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={8}
          fontFamily="'JetBrains Mono', monospace"
        >
          eff.
        </text>
      </svg>
      <div
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>
        {sublabel}
      </div>
    </div>
  );
}

// ── WinnerBadge ────────────────────────────────────────────────────────────
function WinnerBadge({ text, color, rgb }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        padding: "2px 8px",
        borderRadius: 20,
        background: `rgba(${rgb},0.15)`,
        color,
        border: `1px solid rgba(${rgb},0.35)`,
        marginLeft: 6,
        fontWeight: 700,
      }}
    >
      {text} ⚡
    </span>
  );
}

// ── MetricGroup ────────────────────────────────────────────────────────────
function MetricGroup({ title, mhV, nnV, mhLabel, nnLabel, format = (x) => x.toLocaleString() }) {
  const maxV = Math.max(mhV, nnV, 1);
  const mhPct = Math.round((mhV / maxV) * 100);
  const nnPct = Math.round((nnV / maxV) * 100);
  const mhWins = mhV > 0 && mhV < nnV;
  const nnWins = nnV > 0 && nnV < mhV;

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 8,
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </span>
        {mhWins && <WinnerBadge text="MH wins" color="#00e5a0" rgb="0,229,160" />}
        {nnWins && <WinnerBadge text="NN wins" color="#4da6ff" rgb="77,166,255" />}
        {!mhWins && !nnWins && mhV > 0 && (
          <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>
            (tie)
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <AnimatedBar
          label="Manhattan"
          value={mhV}
          maxValue={maxV}
          pct={mhPct}
          color="linear-gradient(90deg,#00e5a0,#00bfa0)"
          accentRgb="0,229,160"
        />
        <AnimatedBar
          label="NN"
          value={nnV}
          maxValue={maxV}
          pct={nnPct}
          color="linear-gradient(90deg,#4da6ff,#3385cc)"
          accentRgb="77,166,255"
        />
      </div>
    </div>
  );
}

// ── SpiderChart — SVG radar chart ─────────────────────────────────────────
function SpiderChart({ mhResult, nnResult }) {
  const cx = 90, cy = 90, r = 65;
  const axes = ["Nodes ↓", "Bước ↓", "Tốc độ ↑"];
  const n = axes.length;

  const mhNodes = mhResult?.nodes ?? 0;
  const nnNodes = nnResult?.nodes ?? 0;
  const mhSteps = mhResult?.cost ?? 0;
  const nnSteps = nnResult?.cost ?? 0;
  const mhTime = mhResult?.time_ms ?? 0;
  const nnTime = nnResult?.time_ms ?? 0;

  const maxNodes = Math.max(mhNodes, nnNodes, 1);
  const maxSteps = Math.max(mhSteps, nnSteps, 1);
  const maxTime = Math.max(mhTime, nnTime, 1);

  // for nodes & steps: lower is better, so invert
  const mhRaw = [
    1 - mhNodes / maxNodes,
    1 - mhSteps / maxSteps,
    1 - mhTime / maxTime,
  ];
  const nnRaw = [
    1 - nnNodes / maxNodes,
    1 - nnSteps / maxSteps,
    1 - nnTime / maxTime,
  ];

  const angle = (i) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const point = (i, val) => {
    const a = angle(i);
    const d = r * Math.max(0.05, val);
    return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a) };
  };

  const toPath = (vals) =>
    vals
      .map((v, i) => {
        const p = point(i, v);
        return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  // axis labels
  const labelOffset = 14;
  const labelPt = (i) => {
    const a = angle(i);
    return {
      x: cx + (r + labelOffset) * Math.cos(a),
      y: cy + (r + labelOffset) * Math.sin(a),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {/* grid rings */}
      {gridLevels.map((lvl) => (
        <polygon
          key={lvl}
          points={Array.from({ length: n }, (_, i) => {
            const a = angle(i);
            return `${(cx + r * lvl * Math.cos(a)).toFixed(1)},${(cy + r * lvl * Math.sin(a)).toFixed(1)}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={(cx + r * Math.cos(a)).toFixed(1)}
            y2={(cy + r * Math.sin(a)).toFixed(1)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* NN polygon */}
      <path
        d={toPath(nnRaw)}
        fill="rgba(77,166,255,0.18)"
        stroke="#4da6ff"
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px rgba(77,166,255,0.4))" }}
      />

      {/* Manhattan polygon */}
      <path
        d={toPath(mhRaw)}
        fill="rgba(0,229,160,0.18)"
        stroke="#00e5a0"
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px rgba(0,229,160,0.4))" }}
      />

      {/* axis labels */}
      {axes.map((label, i) => {
        const lp = labelPt(i);
        return (
          <text
            key={i}
            x={lp.x.toFixed(1)}
            y={lp.y.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6b7280"
            fontSize={8.5}
            fontFamily="'JetBrains Mono', monospace"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Main Chart component ───────────────────────────────────────────────────
export default function Chart({ mhResult, nnResult }) {
  if (!mhResult || !nnResult) return null;

  const mhNodes = mhResult.nodes ?? 0;
  const nnNodes = nnResult.nodes ?? 0;
  const mhSteps = mhResult.cost ?? 0;
  const nnSteps = nnResult.cost ?? 0;
  const mhTime = mhResult.time_ms ?? 0;
  const nnTime = nnResult.time_ms ?? 0;

  const maxNodes = Math.max(mhNodes, nnNodes, 1);
  const maxTime = Math.max(mhTime, nnTime, 1);

  // efficiency = inverse: the fewer nodes expanded, the more efficient
  const mhEff = Math.round((1 - mhNodes / maxNodes) * 100 + (nnNodes > 0 ? 50 : 0));
  const nnEff = Math.round((1 - nnNodes / maxNodes) * 100 + (mhNodes > 0 ? 50 : 0));
  const clamp = (v) => Math.min(100, Math.max(0, v));

  return (
    <div>
      {/* Top gauges row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: 24,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <RadialGauge
          pct={clamp(100 - Math.round((mhNodes / maxNodes) * 100))}
          color="#00e5a0"
          label="Manhattan"
          sublabel={`${mhNodes.toLocaleString()} nodes`}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <SpiderChart mhResult={mhResult} nnResult={nnResult} />
          <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
            {[["Manhattan", "#00e5a0"], ["NN", "#4da6ff"]].map(([name, c]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 9, color: "#6b7280", fontFamily: "'JetBrains Mono',monospace" }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <RadialGauge
          pct={clamp(100 - Math.round((nnNodes / maxNodes) * 100))}
          color="#4da6ff"
          label="NN"
          sublabel={`${nnNodes.toLocaleString()} nodes`}
        />
      </div>

      {/* Bar charts */}
      <MetricGroup
        title="Nodes mở rộng (thấp hơn = tốt hơn)"
        mhV={mhNodes}
        nnV={nnNodes}
      />
      <MetricGroup
        title="Số bước đi (thấp hơn = tốt hơn)"
        mhV={mhSteps}
        nnV={nnSteps}
      />
      <MetricGroup
        title="Thời gian chạy ms (thấp hơn = tốt hơn)"
        mhV={mhTime}
        nnV={nnTime}
      />

      {/* Summary verdict */}
      <div
        style={{
          marginTop: 4,
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#6b7280",
          lineHeight: 1.7,
        }}
      >
        <span style={{ color: "#00e5a0", fontWeight: 700 }}>Manhattan</span>:{" "}
        {mhNodes.toLocaleString()} nodes · {mhSteps} bước · {mhTime}ms
        {"  |  "}
        <span style={{ color: "#4da6ff", fontWeight: 700 }}>NN</span>:{" "}
        {nnNodes.toLocaleString()} nodes · {nnSteps} bước · {nnTime}ms
        {mhNodes < nnNodes && (
          <span style={{ color: "#00e5a0" }}>
            {"  →  "}MH tiết kiệm{" "}
            <strong>{(((nnNodes - mhNodes) / nnNodes) * 100).toFixed(1)}%</strong> nodes
          </span>
        )}
        {nnNodes < mhNodes && (
          <span style={{ color: "#4da6ff" }}>
            {"  →  "}NN tiết kiệm{" "}
            <strong>{(((mhNodes - nnNodes) / mhNodes) * 100).toFixed(1)}%</strong> nodes
          </span>
        )}
      </div>
    </div>
  );
}

