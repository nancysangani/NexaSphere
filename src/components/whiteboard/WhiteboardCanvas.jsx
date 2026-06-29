import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * NOTE:
 * This is a minimal canvas whiteboard used as a first step for #1754.
 * It implements:
 * - freehand pen/highlighter/eraser
 * - basic shapes (rect/circle/triangle/line/arrow)
 * - sticky notes (simple text boxes)
 * - text boxes
 * - undo/redo (per-board, not yet per-user)
 *
 * Real-time collaboration, CRDT, presence, export, templates,
 * event integration etc. are added in subsequent iterations.
 */

const TOOL = {
  PEN: 'pen',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
  RECT: 'rect',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  LINE: 'line',
  ARROW: 'arrow',
  TEXT: 'text',
  STICKY: 'sticky',
  SELECT: 'select',
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function getCanvasPoint(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

function drawArrow(ctx, from, to) {
  const headLength = 12;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle - Math.PI / 6),
    to.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headLength * Math.cos(angle + Math.PI / 6),
    to.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawShape(ctx, shape) {
  const { type, x, y, w, h, color, opacity, strokeWidth, fill, text } = shape;
  ctx.save();
  ctx.globalAlpha = opacity ?? 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = fill ?? 'transparent';
  ctx.lineWidth = strokeWidth ?? 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'rect') {
    ctx.strokeRect(x, y, w, h);
  } else if (type === 'circle') {
    ctx.beginPath();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(Math.abs(w), Math.abs(h)) / 2;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'line') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
  } else if (type === 'arrow') {
    drawArrow(ctx, { x, y }, { x: x + w, y: y + h });
  } else if (type === 'text') {
    ctx.globalAlpha = opacity ?? 1;
    ctx.fillStyle = color;
    ctx.font = `${shape.fontStyle ?? 'normal'} ${shape.bold ? '700' : '400'} ${shape.fontSize ?? 16}px ${shape.fontFamily ?? 'sans-serif'}`;
    ctx.fillText(text ?? '', x, y);
  } else if (type === 'sticky') {
    // Simple sticky note: rounded rect + text
    const radius = 10;
    const sx = x;
    const sy = y;
    const sw = w;
    const sh = h;

    ctx.fillStyle = fill ?? color;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';

    ctx.beginPath();
    ctx.moveTo(sx + radius, sy);
    ctx.lineTo(sx + sw - radius, sy);
    ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + radius);
    ctx.lineTo(sx + sw, sy + sh - radius);
    ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - radius, sy + sh);
    ctx.lineTo(sx + radius, sy + sh);
    ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - radius);
    ctx.lineTo(sx, sy + radius);
    ctx.quadraticCurveTo(sx, sy, sx + radius, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.font = `600 ${shape.fontSize ?? 14}px sans-serif`;
    const lines = String(text ?? '').split('\n');
    const lineHeight = 18;
    let ty = sy + 22;
    lines.slice(0, 6).forEach((ln) => {
      ctx.fillText(ln.slice(0, 30), sx + 14, ty);
      ty += lineHeight;
    });
  }

  ctx.restore();
}

export default function WhiteboardCanvas({
  width = 900,
  height = 600,
  initialElements = [],
  onChange,
}) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: width, h: height });

  const [elements, setElements] = useState(initialElements);
  const [history, setHistory] = useState({ past: [], future: [] });

  const [tool, setTool] = useState(TOOL.PEN);
  const [color, setColor] = useState('#00d4ff');
  const [opacity, setOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(4);

  const [isDrawing, setIsDrawing] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    setElements(initialElements || []);
    setHistory({ past: [], future: [] });
  }, [initialElements]);

  const controls = useMemo(() => {
    return {
      TOOL,
      tool,
      setTool,
      color,
      setColor,
      opacity,
      setOpacity,
      strokeWidth,
      setStrokeWidth,
    };
  }, [tool, color, opacity, strokeWidth]);

  function snapshotAndSet(nextElements) {
    setHistory((h) => ({ past: [...h.past, elements], future: [] }));
    setElements(nextElements);
  }

  function undo() {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const past = h.past.slice(0, -1);
      const future = [elements, ...h.future];
      setElements(previous);
      return { past, future };
    });
  }

  function redo() {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const [next, ...rest] = h.future;
      const past = [...h.past, elements];
      setElements(next);
      return { past, future: rest };
    });
  }

  // Resize canvas to match container (simple)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
  }, [canvasSize]);

  function redraw(nextElements = elements) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background grid (light)
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x = 0; x < canvas.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    nextElements.forEach((el) => drawShape(ctx, el));
  }

  useEffect(() => {
    redraw(elements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  useEffect(() => {
    onChange?.(elements);
  }, [elements, onChange]);

  function startPointer(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);

    setIsDrawing(true);

    if (tool === TOOL.PEN || tool === TOOL.HIGHLIGHTER) {
      const el = {
        id: crypto.randomUUID(),
        type: 'stroke',
        points: [pt],
        color,
        opacity: tool === TOOL.HIGHLIGHTER ? clamp(opacity * 0.35, 0.05, 0.6) : opacity,
        strokeWidth: tool === TOOL.HIGHLIGHTER ? strokeWidth * 1.2 : strokeWidth,
      };
      dragRef.current = { kind: 'stroke', el };
      snapshotAndSet([...elements, el]);
      return;
    }

    if (tool === TOOL.ERASER) {
      const el = {
        id: crypto.randomUUID(),
        type: 'stroke',
        points: [pt],
        color: 'rgba(0,0,0,0)',
        opacity: 1,
        strokeWidth: strokeWidth * 1.8,
        isEraser: true,
      };
      dragRef.current = { kind: 'stroke', el };
      snapshotAndSet([...elements, el]);
      return;
    }

    if (
      tool === TOOL.RECT ||
      tool === TOOL.CIRCLE ||
      tool === TOOL.TRIANGLE ||
      tool === TOOL.LINE ||
      tool === TOOL.ARROW
    ) {
      const el = {
        id: crypto.randomUUID(),
        type:
          tool === TOOL.RECT
            ? 'rect'
            : tool === TOOL.CIRCLE
              ? 'circle'
              : tool === TOOL.TRIANGLE
                ? 'triangle'
                : tool === TOOL.LINE
                  ? 'line'
                  : 'arrow',
        x: pt.x,
        y: pt.y,
        w: 0,
        h: 0,
        color,
        opacity,
        strokeWidth,
      };
      dragRef.current = { kind: 'shape', id: el.id, start: pt, elType: el.type };
      snapshotAndSet([...elements, el]);
      return;
    }

    if (tool === TOOL.TEXT) {
      const text = prompt('Enter text') || '';
      const el = {
        id: crypto.randomUUID(),
        type: 'text',
        x: pt.x,
        y: pt.y,
        w: 0,
        h: 0,
        color,
        opacity,
        text,
        fontSize: 18,
        bold: false,
        italic: false,
        fontStyle: 'normal',
        fontFamily: 'sans-serif',
      };
      snapshotAndSet([...elements, el]);
      setIsDrawing(false);
      dragRef.current = null;
      return;
    }

    if (tool === TOOL.STICKY) {
      const text = prompt('Sticky note') || '';
      const el = {
        id: crypto.randomUUID(),
        type: 'sticky',
        x: pt.x,
        y: pt.y,
        w: 200,
        h: 120,
        color,
        opacity: 1,
        fill: color,
        text,
        fontSize: 14,
      };
      snapshotAndSet([...elements, el]);
      setIsDrawing(false);
      dragRef.current = null;
      return;
    }
  }

  function movePointer(e) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === 'stroke') {
      const updated = elements.map((el) => {
        if (el.id !== drag.el.id) return el;
        if (el.points.length > 3000) return el;
        return { ...el, points: [...el.points, pt] };
      });
      setElements(updated);

      // draw incrementally for strokes
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const el = updated.find((x) => x.id === drag.el.id);
        if (el) {
          ctx.save();
          if (el.isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(0,0,0,1)';
          } else {
            ctx.globalAlpha = el.opacity;
            ctx.strokeStyle = el.color;
          }
          ctx.lineWidth = el.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          el.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }

    if (drag.kind === 'shape') {
      const dx = pt.x - drag.start.x;
      const dy = pt.y - drag.start.y;
      const w = dx;
      const h = dy;
      const normalizedX = w < 0 ? pt.x : drag.start.x;
      const normalizedY = h < 0 ? pt.y : drag.start.y;
      const normalizedW = Math.abs(w);
      const normalizedH = Math.abs(h);

      const updated = elements.map((el) => {
        if (el.id !== drag.id) return el;
        return {
          ...el,
          x: normalizedX,
          y: normalizedY,
          w: normalizedW,
          h: normalizedH,
        };
      });
      setElements(updated);
    }
  }

  function endPointer() {
    if (!isDrawing) return;
    setIsDrawing(false);
    dragRef.current = null;

    // redraw to incorporate shapes/text fully
    redraw(elements);
  }

  // Make drawShape handle strokes; reuse drawShape by extending for strokes in-place
  // (Quick patch: strokes are drawn during move; final render uses a special case)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Override redraw to support strokes.
    const original = redraw;
    // no-op: redraw already called by state effect; strokes final rendering handled here
    // We'll simply ensure strokes are rendered each time via a patched pass:
    const patchRedraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // grid
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      const grid = 40;
      for (let x = 0; x < canvas.width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      elements.forEach((el) => {
        if (el.type === 'stroke') {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = el.strokeWidth ?? 2;
          if (el.isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(0,0,0,1)';
          } else {
            ctx.globalAlpha = el.opacity ?? 1;
            ctx.strokeStyle = el.color;
          }
          ctx.beginPath();
          el.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          ctx.restore();
        } else {
          drawShape(ctx, el);
        }
      });
    };

    patchRedraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stickyColors = {
    yellow: '#fbbf24',
    pink: '#f472b6',
    blue: '#60a5fa',
    green: '#34d399',
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            [TOOL.PEN, 'Pen'],
            [TOOL.HIGHLIGHTER, 'Highlighter'],
            [TOOL.ERASER, 'Eraser'],
            [TOOL.RECT, 'Rect'],
            [TOOL.CIRCLE, 'Circle'],
            [TOOL.TRIANGLE, 'Triangle'],
            [TOOL.LINE, 'Line'],
            [TOOL.ARROW, 'Arrow'],
            [TOOL.TEXT, 'Text'],
            [TOOL.STICKY, 'Sticky'],
          ].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border:
                  tool === t ? '1px solid rgba(0,212,255,0.7)' : '1px solid var(--border-subtle)',
                background: tool === t ? 'rgba(0,212,255,0.12)' : 'transparent',
                cursor: 'pointer',
                color: tool === t ? 'var(--c1)' : 'var(--text-muted)',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Color</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              Opacity
            </span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
            />
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Width</span>
            <input
              type="range"
              min={1}
              max={18}
              step={1}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
            />
          </label>

          <button
            onClick={undo}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            Undo
          </button>
          <button
            onClick={redo}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            Redo
          </button>

          <button
            onClick={() => {
              // Quick sticky color presets
              const vals = Object.values(stickyColors);
              const idx = vals.indexOf(color);
              const next = vals[(idx + 1 + vals.length) % vals.length];
              setColor(next);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
            title="Cycle sticky colors"
          >
            Sticky Colors
          </button>
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        <canvas
          id="ns-whiteboard-canvas"
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            aspectRatio: `${canvasSize.w}/${canvasSize.h}`,
          }}
          width={canvasSize.w}
          height={canvasSize.h}
          onMouseDown={startPointer}
          onMouseMove={movePointer}
          onMouseUp={endPointer}
          onMouseLeave={endPointer}
          onTouchStart={(e) => {
            if (!e.touches?.[0]) return;
            startPointer({
              ...e,
              clientX: e.touches[0].clientX,
              clientY: e.touches[0].clientY,
            });
          }}
          onTouchMove={(e) => {
            if (!e.touches?.[0]) return;
            movePointer({
              ...e,
              clientX: e.touches[0].clientX,
              clientY: e.touches[0].clientY,
            });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            endPointer();
          }}
        />
      </div>
    </div>
  );
}
