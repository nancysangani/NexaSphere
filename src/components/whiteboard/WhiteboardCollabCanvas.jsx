import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { drawShapeForCanvas, drawStrokesForCanvas } from './whiteboardRenderUtils';

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

function useYElements({ doc }) {
  const yElements = useMemo(() => doc.getArray('elements'), [doc]);
  const [elements, setElements] = useState(() => yElements.toArray());

  useEffect(() => {
    const handler = () => setElements(yElements.toArray());
    yElements.observeDeep(handler);
    handler();
    return () => yElements.unobserveDeep(handler);
  }, [yElements]);

  return { yElements, elements };
}

export default function WhiteboardCollabCanvas({
  doc,
  providerAwareness,
  user,
  width,
  height,
  initialElements,
  onLocalSnapshot,
  showPresence = true,
}) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: width, h: height });

  const { yElements, elements } = useYElements({ doc });

  const [tool, setTool] = useState(TOOL.PEN);
  const [color, setColor] = useState('#00d4ff');
  const [opacity, setOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(4);

  const [isDrawing, setIsDrawing] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
  }, [canvasSize]);

  // One-time template seeding (if doc empty)
  useEffect(() => {
    if (!initialElements?.length) return;

    const yState = doc.getMap('state');
    const initialized = !!yState.get('seeded');
    if (initialized) return;

    if (yElements.length === 0) {
      doc.transact(() => {
        yElements.push(initialElements);
        yState.set('seeded', true);
      });
    } else {
      yState.set('seeded', true);
    }
  }, [doc, initialElements, yElements]);

  const userColor = user?.color || '#00d4ff';

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background grid
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

    // draw elements
    elements.forEach((el) => {
      if (el.type === 'stroke') {
        drawStrokesForCanvas(ctx, el);
      } else {
        drawShapeForCanvas(ctx, el);
      }
    });

    // presence cursors
    if (showPresence && providerAwareness) {
      const states = Array.from(providerAwareness.getStates().values());
      states.forEach((st) => {
        const cursor = st?.cursor;
        const u = st?.user;
        if (!cursor?.visible || !u) return;
        const x = cursor.x * (canvas.width / (providerAwareness._target?.width || canvas.width));
        const y = cursor.y * (canvas.height / (providerAwareness._target?.height || canvas.height));
        // Simple cursor dot
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = u.color || '#00d4ff';
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '12px sans-serif';
        ctx.fillText(u.initials || 'U', cursor.x + 6, cursor.y - 6);
        ctx.restore();
      });
    }
  };

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, showPresence, providerAwareness]);

  const updateAwarenessCursor = (clientX, clientY) => {
    if (!providerAwareness || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const pt = getCanvasPoint({ clientX, clientY }, canvas);
    providerAwareness.setLocalStateField('cursor', {
      x: pt.x,
      y: pt.y,
      visible: true,
    });
  };

  const commitElements = (nextElements) => {
    doc.transact(() => {
      yElements.delete(0, yElements.length);
      yElements.push(nextElements);
    });
    onLocalSnapshot?.(nextElements);
  };

  function snapshotAndCommit(next) {
    commitElements(next);
  }

  function undoUnsupported() {
    // This iteration focuses on realtime correctness; undo/redo per-user will be added later.
  }

  const startPointer = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);

    setIsDrawing(true);

    if (tool === TOOL.PEN || tool === TOOL.HIGHLIGHTER) {
      const el = {
        id: crypto.randomUUID(),
        type: 'stroke',
        points: [pt],
        color: tool === TOOL.HIGHLIGHTER ? userColor : color,
        opacity: tool === TOOL.HIGHLIGHTER ? clamp(opacity * 0.35, 0.05, 0.6) : opacity,
        strokeWidth: tool === TOOL.HIGHLIGHTER ? strokeWidth * 1.2 : strokeWidth,
      };
      dragRef.current = { kind: 'stroke', id: el.id, el };
      snapshotAndCommit([...elements, el]);
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
      dragRef.current = { kind: 'stroke', id: el.id, el };
      snapshotAndCommit([...elements, el]);
      return;
    }

    if (
      tool === TOOL.RECT ||
      tool === TOOL.CIRCLE ||
      tool === TOOL.TRIANGLE ||
      tool === TOOL.LINE ||
      tool === TOOL.ARROW
    ) {
      const type =
        tool === TOOL.RECT
          ? 'rect'
          : tool === TOOL.CIRCLE
            ? 'circle'
            : tool === TOOL.TRIANGLE
              ? 'triangle'
              : tool === TOOL.LINE
                ? 'line'
                : 'arrow';

      const el = {
        id: crypto.randomUUID(),
        type,
        x: pt.x,
        y: pt.y,
        w: 0,
        h: 0,
        color,
        opacity,
        strokeWidth,
      };
      dragRef.current = { kind: 'shape', id: el.id, start: pt };
      snapshotAndCommit([...elements, el]);
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
      snapshotAndCommit([...elements, el]);
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
      snapshotAndCommit([...elements, el]);
      setIsDrawing(false);
      dragRef.current = null;
      return;
    }
  };

  const movePointer = (e) => {
    if (!isDrawing) {
      updateAwarenessCursor(e.clientX, e.clientY);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);

    updateAwarenessCursor(e.clientX, e.clientY);

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === 'stroke') {
      const next = elements.map((el) => {
        if (el.id !== drag.id) return el;
        if (el.points.length > 3000) return el;
        return { ...el, points: [...el.points, pt] };
      });
      snapshotAndCommit(next);
      return;
    }

    if (drag.kind === 'shape') {
      const dx = pt.x - drag.start.x;
      const dy = pt.y - drag.start.y;
      const w = dx;
      const h = dy;
      const normalizedX = w < 0 ? pt.x : drag.start.x;
      const normalizedY = h < 0 ? pt.y : drag.start.y;

      const next = elements.map((el) => {
        if (el.id !== drag.id) return el;
        return {
          ...el,
          x: normalizedX,
          y: normalizedY,
          w: Math.abs(w),
          h: Math.abs(h),
        };
      });
      snapshotAndCommit(next);
    }
  };

  const endPointer = () => {
    setIsDrawing(false);
    dragRef.current = null;
    // hide cursor
    if (providerAwareness) {
      providerAwareness.setLocalStateField('cursor', {
        x: 0,
        y: 0,
        visible: false,
      });
    }
  };

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
            onClick={undoUnsupported}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
            title="Undo/Redo per-user will be added later"
          >
            Undo
          </button>

          <button
            onClick={undoUnsupported}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
            title="Undo/Redo per-user will be added later"
          >
            Redo
          </button>

          <button
            onClick={() => {
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
            const t = e.touches[0];
            startPointer({ clientX: t.clientX, clientY: t.clientY });
          }}
          onTouchMove={(e) => {
            if (!e.touches?.[0]) return;
            const t = e.touches[0];
            movePointer({ clientX: t.clientX, clientY: t.clientY });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            endPointer();
          }}
        />
      </div>

      <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
        Collaboration: CRDT synced (y-websocket). Presence enabled.
      </div>
    </div>
  );
}
