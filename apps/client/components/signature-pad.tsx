'use client';
import { useEffect, useRef, useState } from 'react';

// A signature is a paper-like record: dark ink on white, whatever the theme
const PAPER = '#FFFFFF';
const INK = '#111827';

interface Props {
  onSave: (png: Blob) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

/** Finger / mouse signature capture that hands back a PNG. */
export function SignaturePad({ onSave, onCancel, saving }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const reset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setEmpty(true);
  };

  useEffect(reset, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext('2d')!;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d')!;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setEmpty(false);
  };

  const end = () => { drawing.current = false; };

  const save = () => {
    canvasRef.current?.toBlob((blob) => blob && onSave(blob), 'image/png');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        aria-label="Signature area"
        style={{ width: '100%', height: 170, borderRadius: 'var(--radius-sm)', border: '1px solid var(--edge)', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
      />
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6 }}>Sign inside the box</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button type="button" className="btn-outline" style={{ flex: 0.5 }} onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-outline" style={{ flex: 0.5 }} onClick={reset} disabled={empty}>Clear</button>
        <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={empty || saving}>
          {saving ? <span className="spinner" /> : 'Save Signature'}
        </button>
      </div>
    </div>
  );
}
