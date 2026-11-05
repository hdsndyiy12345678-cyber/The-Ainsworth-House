import type { State } from "./store";
import { useRef, useState } from "react";
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  Undo2,
  Redo2,
  Download,
  Plus,
} from "lucide-react";
import { uid } from "./store";
import type { ModuleProps } from "./Post";
export function flood(pixels: string[], start: number, color: string) {
  const old = pixels[start];
  if (old === color) return pixels;
  const result = [...pixels],
    queue = [start];
  result[start] = color;
  while (queue.length) {
    const i = queue.pop()!;
    for (const n of [
      i % 16 > 0 ? i - 1 : -1,
      i % 16 < 15 ? i + 1 : -1,
      i >= 16 ? i - 16 : -1,
      i < 240 ? i + 16 : -1,
    ])
      if (n >= 0 && result[n] === old) {
        result[n] = color;
        queue.push(n);
      }
  }
  return result;
}
export function PixelWorkbench({ state, update, notify }: ModuleProps) {
  const atelier: NonNullable<State["atelier"]> = state.atelier || {
    strokes: [],
    pixels: Array(256).fill(""),
  };
  const works = atelier.pixelWorks || [];
  const [workId, setWorkId] = useState("original"),
    [tool, setTool] = useState("pen"),
    [color, setColor] = useState("#536747"),
    [zoom, setZoom] = useState(1),
    [past, setPast] = useState<string[][]>([]),
    [future, setFuture] = useState<string[][]>([]);
  const drawing = useRef(false),
    before = useRef<string[] | null>(null);
  const pixels =
    workId === "original"
      ? atelier.pixels
      : works.find((w) => w.id === workId)?.pixels || atelier.pixels;
  function write(next: string[]) {
    update((s) => {
      const a = s.atelier || atelier;
      return {
        ...s,
        atelier:
          workId === "original"
            ? { ...a, pixels: next }
            : {
                ...a,
                pixelWorks: (a.pixelWorks || []).map((w) =>
                  w.id === workId ? { ...w, pixels: next } : w,
                ),
              },
      };
    });
  }
  function apply(i: number) {
    const next =
      tool === "fill"
        ? flood(pixels, i, color)
        : pixels.map((c, n) =>
            n === i ? (tool === "eraser" ? "" : color) : c,
          );
    write(next);
  }
  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    if (before.current) {
      setPast((p) => [...p.slice(-39), before.current!]);
      before.current = null;
      setFuture([]);
    }
  }
  function exportPng() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    pixels.forEach((v, i) => {
      if (v) {
        ctx.fillStyle = v;
        ctx.fillRect((i % 16) * 16, Math.floor(i / 16) * 16, 16, 16);
      }
    });
    const a = document.createElement("a");
    a.href = c.toDataURL();
    a.download = "elena-pixel-garden.png";
    a.click();
    notify("투명 배경 PNG로 내보냈어요.");
  }
  return (
    <div className="pixel-workbench">
      <aside className="pixel-sidebar">
        <label>
          내 스케치북
          <select
            value={workId}
            onChange={(e) => {
              setWorkId(e.target.value);
              setPast([]);
              setFuture([]);
            }}
          >
            <option value="original">처음 만든 그림</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            const id = uid();
            update((s) => ({
              ...s,
              atelier: {
                ...(s.atelier || atelier),
                pixelWorks: [
                  ...(s.atelier?.pixelWorks || []),
                  {
                    id,
                    name: `작은 그림 ${works.length + 1}`,
                    pixels: Array(256).fill(""),
                  },
                ],
              },
            }));
            setWorkId(id);
            setPast([]);
            setFuture([]);
          }}
        >
          <Plus size={15} /> 새 그림
        </button>
        <h3>Ink & colour</h3>
        <div className="pixel-palette">
          {[
            "#536747",
            "#273d34",
            "#6c85a1",
            "#e9ddc4",
            "#b47550",
            "#60383e",
            "#b89b67",
            "#30241d",
          ].map((c) => (
            <button
              key={c}
              style={{ background: c }}
              aria-label={`색상 ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <label>
          나만의 색
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <p className="muted">
          16 × 16 · 자동 저장
          <br />
          연속해서 그리려면 누른 채 움직이세요.
        </p>
      </aside>
      <section className="pixel-drawing">
        <div className="pixel-tools">
          {[
            ["pen", "펜", Paintbrush],
            ["eraser", "지우개", Eraser],
            ["fill", "채우기", PaintBucket],
          ].map(([t, label, Icon]) => {
            const I = Icon as typeof Paintbrush;
            return (
              <button
                key={t as string}
                onClick={() => setTool(t as string)}
                aria-pressed={tool === t}
              >
                <I size={16} />
                {label as string}
              </button>
            );
          })}
          <button
            disabled={!past.length}
            onClick={() => {
              setFuture((f) => [...f, pixels]);
              write(past.at(-1)!);
              setPast((p) => p.slice(0, -1));
            }}
          >
            <Undo2 size={16} />
            실행 취소
          </button>
          <button
            disabled={!future.length}
            onClick={() => {
              setPast((p) => [...p, pixels]);
              write(future.at(-1)!);
              setFuture((f) => f.slice(0, -1));
            }}
          >
            <Redo2 size={16} />
            다시 실행
          </button>
          <label className="sr-only" htmlFor="pixel-zoom">
            픽셀 확대
          </label>
          <select
            id="pixel-zoom"
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
          >
            <option value="1">100%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
          </select>
        </div>
        <div
          className="pixel-canvas-wrap"
          onPointerUp={finish}
          onPointerCancel={finish}
          onPointerLeave={finish}
        >
          <div
            className="pixel-grid"
            aria-label="16 곱하기 16 픽셀 작업판"
            onPointerMove={(e) => {
              if (
                drawing.current &&
                e.pointerType !== "mouse" &&
                tool !== "fill"
              ) {
                const target = document
                  .elementFromPoint(e.clientX, e.clientY)
                  ?.closest<HTMLElement>("[data-pixel]");
                if (target) apply(Number(target.dataset.pixel));
              }
            }}
            style={{ width: `${704 * zoom}px`, minWidth: `${704 * zoom}px` }}
          >
            {pixels.map((c, i) => (
              <button
                key={i}
                data-pixel={i}
                aria-label={`${Math.floor(i / 16) + 1}행 ${(i % 16) + 1}열 픽셀`}
                style={{ background: c || "transparent" }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  drawing.current = true;
                  before.current = [...pixels];
                  apply(i);
                }}
                onPointerEnter={() => {
                  if (drawing.current && tool !== "fill") apply(i);
                }}
                onClick={(e) => {
                  if (e.detail === 0) {
                    setPast((p) => [...p, pixels]);
                    setFuture([]);
                    apply(i);
                  }
                }}
              />
            ))}
          </div>
        </div>
        <div className="pixel-status">
          <span>16 × 16 · 내 기기에 보관</span>
          <button className="primary" onClick={exportPng}>
            <Download size={16} />
            픽셀 그림 PNG 내보내기
          </button>
        </div>
      </section>
    </div>
  );
}
