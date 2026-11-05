import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Stroke } from "./store";
export function Ink({
  strokes,
  onChange,
  guide,
  compact = false,
}: {
  strokes: Stroke[];
  guide?: string;
  compact?: boolean;
  onChange: (s: Stroke[]) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    active = useRef<Stroke | null>(null),
    pointer = useRef<number | null>(null),
    [erase, setErase] = useState(false),
    [width, setWidth] = useState(3),
    [color, setColor] = useState("#35463a"),
    [zoom, setZoom] = useState(1),
    [redo, setRedo] = useState<Stroke[]>([]),
    [stylus, setStylus] = useState(
      "S펜 버튼 지원은 기기와 브라우저에 따라 다릅니다. 지우개 버튼을 대체 조작으로 사용할 수 있어요.",
    );
  function paint(extra?: Stroke) {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(c.width / 800, c.height / 500);
    for (const s of [...strokes, ...(extra ? [extra] : [])]) {
      ctx.globalCompositeOperation = s.erase
        ? "destination-out"
        : "source-over";
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (s.points.length === 1) {
        const p = s.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, (s.width * Math.max(0.25, p.p)) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 1; i < s.points.length; i++) {
        const p = s.points[i],
          prev = s.points[i - 1];
        ctx.lineWidth = s.width * Math.max(0.25, (p.p + prev.p) / 2);
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  useEffect(() => {
    paint();
  }, [strokes, zoom]);
  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 800) / r.width,
      y: ((e.clientY - r.top) * 500) / r.height,
      p: e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 1,
    };
  };
  function start(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== null) return;
    e.preventDefault();
    pointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const barrel = (e.buttons & 32) !== 0 || e.button === 5;
    if (e.pointerType === "pen")
      setStylus(
        barrel
          ? "S펜 지우개 이벤트를 감지했어요. 버튼을 놓으면 펜으로 돌아갑니다."
          : "펜 입력과 필압을 사용 중입니다. 버튼 지우개가 작동하지 않으면 화면의 지우개를 사용하세요.",
      );
    active.current = {
      color,
      width: erase || barrel ? width * 5 : width,
      erase: erase || barrel,
      points: [point(e)],
    };
    paint(active.current);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !active.current) return;
    active.current.points.push(point(e));
    paint(active.current);
  }
  function end(e: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || !active.current) return;
    const result = active.current;
    active.current = null;
    pointer.current = null;
    setRedo([]);
    onChange([...strokes, result]);
  }
  return (
    <div className={`ink-pad ${compact ? "compact-ink" : ""}`}>
      <div className="ink-tools">
        <button
          type="button"
          aria-pressed={!erase}
          onClick={() => setErase(false)}
        >
          펜
        </button>
        <button
          type="button"
          aria-pressed={erase}
          onClick={() => setErase(true)}
        >
          지우개
        </button>
        <label>
          굵기 {width}px
          <input
            aria-label="펜 굵기"
            type="range"
            min="1"
            max="16"
            value={width}
            onChange={(e) => setWidth(+e.target.value)}
          />
        </label>
        <label>
          잉크
          <input
            aria-label="잉크 색상"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!strokes.length}
          onClick={() => {
            setRedo([...redo, strokes.at(-1)!]);
            onChange(strokes.slice(0, -1));
          }}
        >
          실행 취소
        </button>
        <button
          type="button"
          disabled={!redo.length}
          onClick={() => {
            onChange([...strokes, redo.at(-1)!]);
            setRedo(redo.slice(0, -1));
          }}
        >
          다시 실행
        </button>
        <label>
          확대 {Math.round(zoom * 100)}%
          <select
            aria-label="필기 확대"
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
          >
            <option value="1">100%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
          </select>
        </label>
      </div>
      <div className="ink-scroll">
        <div className="ink-sheet" style={{ width: `${zoom * 100}%` }}>
          {guide && (
            <div className="ink-guide" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i}>
                  {guide}　{guide.length < 10 ? guide : ""}
                </span>
              ))}
            </div>
          )}
          <canvas
            ref={canvas}
            width="1600"
            height="1000"
            aria-label="손글씨 캔버스, 펜 또는 손가락으로 쓰기"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        </div>
      </div>
      <p className="muted">
        {stylus} · {strokes.length}획 저장 · 확대해도 원본 벡터 좌표는
        유지됩니다. 키보드 입력은 위 본문 칸을 사용하세요.
      </p>
    </div>
  );
}
