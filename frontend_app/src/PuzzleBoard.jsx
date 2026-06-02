/**
 * PuzzleBoard.jsx
 * ===============
 * Interactive puzzle grid component.
 *
 * Props:
 *   tiles      – number[]   current tile values (0 = blank)
 *   size       – number     grid dimension (3 or 4)
 *   changed    – number[]   indices that changed (highlighted)
 *   color      – "green"|"blue"  highlight color theme
 *   editable   – boolean    enable drag-and-drop / manual input
 *   onTilesChange – (tiles) => void  called when user edits
 */

import { useState, useRef } from "react";

// ── tile size responsive to grid dimension ─────────────────────────────────
const tileConfig = (size) => {
  if (size === 3) return { size: 80, fontSize: 26, gap: 5 };
  if (size === 4) return { size: 58, fontSize: 18, gap: 4 };
  return { size: 46, fontSize: 14, gap: 3 };
};

// ── utility: swap two indices in array ─────────────────────────────────────
const swapArr = (arr, a, b) => {
  const next = [...arr];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
};

// ── PuzzleBoard ────────────────────────────────────────────────────────────
export default function PuzzleBoard({
  tiles,
  size,
  changed = [],
  color = "green",
  editable = false,
  onTilesChange,
}) {
  const { size: tileSize, fontSize, gap } = tileConfig(size);

  // drag state
  const dragSrc = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  // manual input state: index being edited
  const [editing, setEditing] = useState(null);
  const [inputVal, setInputVal] = useState("");

  // ── drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    dragSrc.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // ghost image transparency
    const ghost = e.currentTarget.cloneNode(true);
    ghost.style.opacity = "0.5";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, tileSize / 2, tileSize / 2);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    setDragOver(null);
    if (dragSrc.current === null || dragSrc.current === idx) return;
    const next = swapArr(tiles, dragSrc.current, idx);
    dragSrc.current = null;
    onTilesChange?.(next);
  };

  const handleDragEnd = () => {
    dragSrc.current = null;
    setDragOver(null);
  };

  // ── manual input handlers ───────────────────────────────────────────────
  const startEdit = (idx) => {
    if (!editable) return;
    setEditing(idx);
    setInputVal(tiles[idx] === 0 ? "" : String(tiles[idx]));
  };

  const commitEdit = (idx) => {
    setEditing(null);
    const raw = parseInt(inputVal, 10);
    const maxVal = size * size - 1;
    if (isNaN(raw) || raw < 0 || raw > maxVal) return;

    // if value already exists elsewhere, swap
    const existIdx = tiles.indexOf(raw);
    let next = [...tiles];
    if (existIdx !== -1 && existIdx !== idx) {
      next[existIdx] = next[idx];
    }
    next[idx] = raw;
    onTilesChange?.(next);
  };

  // ── tile appearance ──────────────────────────────────────────────────────
  const getTileStyle = (v, i) => {
    const isChanged = changed.includes(i);
    const isHover = dragOver === i;
    const base = {
      width: tileSize,
      height: tileSize,
      fontSize,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      cursor: editable && v !== 0 ? "grab" : "default",
      transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      position: "relative",
      userSelect: "none",
    };

    if (v === 0) {
      return {
        ...base,
        background: "transparent",
        border: "2px dashed rgba(255,255,255,0.08)",
        cursor: editable ? "default" : "default",
      };
    }

    if (isChanged) {
      const c = color === "blue" ? "77,166,255" : "0,229,160";
      return {
        ...base,
        background: `rgba(${c},0.18)`,
        border: `2px solid rgba(${c},0.7)`,
        color: color === "blue" ? "#4da6ff" : "#00e5a0",
        boxShadow: `0 0 16px rgba(${c},0.25)`,
        transform: "scale(1.06)",
      };
    }

    if (isHover && editable) {
      return {
        ...base,
        background: "rgba(255,255,255,0.1)",
        border: "2px solid rgba(255,255,255,0.3)",
        color: "#e8eaf0",
        transform: "scale(1.04)",
      };
    }

    // normal tile — subtle gradient
    const n = size * size;
    const hue = Math.round((v / n) * 210 + 190); // hue 190–400 range
    return {
      ...base,
      background: `linear-gradient(135deg, hsl(${hue},20%,18%) 0%, hsl(${hue},15%,14%) 100%)`,
      border: "1.5px solid rgba(255,255,255,0.07)",
      color: "#c8ccd6",
    };
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${size}, ${tileSize}px)`,
    gap: `${gap}px`,
  };

  return (
    <div style={gridStyle}>
      {tiles.map((v, i) => {
        const isEditing = editing === i;
        const style = getTileStyle(v, i);

        return (
          <div
            key={i}
            style={style}
            draggable={editable && v !== 0}
            onDragStart={(e) => editable && handleDragStart(e, i)}
            onDragOver={(e) => editable && handleDragOver(e, i)}
            onDrop={(e) => editable && handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onDoubleClick={() => editable && startEdit(i)}
            title={editable ? (v === 0 ? "Ô trống" : "Kéo để di chuyển / Double-click để sửa") : ""}
          >
            {isEditing ? (
              <input
                autoFocus
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onBlur={() => commitEdit(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit(i);
                  if (e.key === "Escape") setEditing(null);
                }}
                style={{
                  width: tileSize - 16,
                  height: tileSize - 16,
                  background: "rgba(0,229,160,0.12)",
                  border: "2px solid #00e5a0",
                  borderRadius: 5,
                  color: "#00e5a0",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize,
                  textAlign: "center",
                  outline: "none",
                }}
              />
            ) : (
              <span style={{ lineHeight: 1 }}>{v !== 0 ? v : ""}</span>
            )}

            {/* drag indicator dot */}
            {editable && v !== 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
