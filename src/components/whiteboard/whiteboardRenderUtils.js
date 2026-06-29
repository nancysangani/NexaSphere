export function drawArrow(ctx, from, to) {
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

export function drawShapeForCanvas(ctx, shape) {
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

export function drawStrokesForCanvas(ctx, el) {
  if (el.type !== 'stroke') return;

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
}
