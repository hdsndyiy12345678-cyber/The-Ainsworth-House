import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { art } from "./assets";
import type { RoomId, State } from "./store";
export const hotspots: Record<
  RoomId,
  { x: number; y: number; label: string; kind: string }[]
> = {
  hall: [
    { x: 73, y: 47, label: "응접실로 들어가기", kind: "drawing" },
    { x: 19, y: 64, label: "저택 지도 펼치기", kind: "map" },
    { x: 64, y: 17, label: "촛불 켜고 끄기", kind: "candle" },
    { x: 34, y: 25, label: "창밖 바라보기", kind: "window" },
  ],
  drawing: [
    { x: 48, y: 45, label: "벽난로 살펴보기", kind: "fire" },
    { x: 47, y: 82, label: "Miso와 교감하기", kind: "pet" },
    { x: 85, y: 77, label: "일기장 펼치기", kind: "diary" },
    { x: 82, y: 25, label: "창밖 바라보기", kind: "window" },
    { x: 70, y: 69, label: "편지 읽기", kind: "post" },
  ],
  owlery: [
    { x: 71, y: 71, label: "Owl Post 열기", kind: "post" },
    { x: 87, y: 40, label: "우편부 부엉이", kind: "owl" },
    { x: 30, y: 44, label: "인물 수첩", kind: "profiles" },
  ],
  bedroom: [
    { x: 84, y: 67, label: "비밀 다이어리", kind: "diary" },
    { x: 38, y: 65, label: "추억함 열기", kind: "keepsakes" },
    { x: 84, y: 43, label: "Miso와 교감하기", kind: "pet" },
  ],
  library: [
    { x: 43, y: 74, label: "세계관 기록", kind: "lore" },
    { x: 63, y: 77, label: "보관한 단서", kind: "clues" },
    { x: 86, y: 20, label: "초상화의 비밀", kind: "portrait" },
  ],
  conservatory: [
    { x: 78, y: 51, label: "마법 식물 돌보기", kind: "plant" },
    { x: 58, y: 73, label: "잎사귀 관찰하기", kind: "fern" },
  ],
  mystery: [
    { x: 50, y: 73, label: "사건 수사 시작", kind: "case" },
    { x: 48, y: 29, label: "진술 기록 보기", kind: "case" },
  ],
  atelier: [
    { x: 40, y: 72, label: "필기와 커시브 연습", kind: "practice" },
    { x: 77, y: 60, label: "픽셀 아트 그리기", kind: "pixel" },
  ],
  attic: [
    { x: 75, y: 73, label: "수집품 상자", kind: "collection" },
    { x: 88, y: 31, label: "오래된 액자 살펴보기", kind: "portrait" },
  ],
};
export type SpriteKind = "cat" | "owl" | "desk" | "effects" | "collectibles";
export function Sprite({
  kind,
  pose = 0,
  className = "",
  style = {},
}: {
  kind: SpriteKind;
  pose?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const rows = kind === "desk" ? 3 : kind === "collectibles" ? 1 : 2,
    cols = kind === "effects" ? 4 : kind === "collectibles" ? 3 : 2;
  const sheet = {
    cat: "miso",
    owl: "owl",
    desk: "objects",
    effects: "effects",
    collectibles: "collectibles",
  }[kind];
  return (
    <span
      aria-hidden="true"
      className={`sprite sprite-${kind} pose-${pose} ${className}`}
      style={{
        backgroundImage: `url("${art(sheet + ".webp")}")`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${((pose % cols) / (cols - 1)) * 100}% ${rows === 1 ? 0 : (Math.floor(pose / cols) / (rows - 1)) * 100}%`,
        ...style,
      }}
    />
  );
}
export function PetArt({
  owl = false,
  pose = 0,
}: {
  owl?: boolean;
  pose?: number;
}) {
  return <Sprite kind={owl ? "owl" : "cat"} pose={pose} className="pet-art" />;
}
function prop(
  kind: string,
): { sheet: SpriteKind; pose: number; width: number } | null {
  return (
    (
      {
        post: { sheet: "desk", pose: 0, width: 14 },
        diary: { sheet: "desk", pose: 2, width: 15 },
        lore: { sheet: "desk", pose: 2, width: 20 },
        clues: { sheet: "desk", pose: 0, width: 16 },
        practice: { sheet: "desk", pose: 3, width: 24 },
        pixel: { sheet: "desk", pose: 3, width: 18 },
        case: { sheet: "desk", pose: 2, width: 20 },
        fern: { sheet: "desk", pose: 3, width: 16 },
      } as Record<string, { sheet: SpriteKind; pose: number; width: number }>
    )[kind] || null
  );
}
export default function Scene({
  state,
  time,
  onInteract,
}: {
  state: State;
  time: "day" | "dusk" | "night";
  onInteract: (kind: string) => void;
}) {
  const view = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 1600, height: 1000 });
  const room = state.room;
  useLayoutEffect(() => {
    const el = view.current!;
    const ob = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(width, height * 1.6),
        height: Math.max(height, width / 1.6),
      });
    });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  useLayoutEffect(() => {
    const el = view.current!;
    el.scrollLeft = Math.max(0, (size.width - el.clientWidth) * 0.55);
  }, [room, size.width]);
  const pose =
    state.pet.action === "sleeping"
      ? 2
      : state.pet.action === "walking"
        ? 3
        : state.pet.action === "happy"
          ? 1
          : time === "night"
            ? 2
            : 0;
  return (
    <div
      className="scene-viewport"
      ref={view}
      tabIndex={0}
      aria-label="저택 공간, 작은 화면에서는 좌우로 둘러볼 수 있습니다"
    >
      <div
        key={room}
        className={`art-stage scene-${room} ${time === "night" ? "is-night" : ""} ${!state.lights ? "lamps-out" : ""}`}
        style={{ width: size.width, height: size.height }}
      >
        <img
          className={`art-plate ${time === "night" && room !== "drawing" ? "night-tint" : ""} ${time === "dusk" ? "dusk-tint" : ""}`}
          src={art(
            room === "drawing" && time === "night"
              ? "drawing-night.webp"
              : room + ".webp",
          )}
          alt={`${room}의 손으로 그린 저택 실내`}
          draggable={false}
        />
        {room !== "hall" && (
          <button
            className="painted-door"
            aria-label="문을 통해 현관으로"
            style={{
              left: `${({ drawing: 10, owlery: 7, bedroom: 61, library: 31, conservatory: 28, mystery: 90, atelier: 9, attic: 30 } as Record<string, number>)[room]}%`,
            }}
            onClick={() => onInteract("hall")}
          >
            <ArrowLeft size={20} />
            <span className="object-tip">Entrance Hall</span>
          </button>
        )}
        {state.weather === "rain" &&
          ["drawing", "owlery", "bedroom", "conservatory", "mystery"].includes(
            room,
          ) && (
            <div
              className={`window-weather weather-${room}`}
              aria-hidden="true"
            >
              <img src={art("rain.webp")} alt="" />
            </div>
          )}
        {room === "drawing" && state.fire && (
          <div className="placed-fire" aria-hidden="true">
            <Sprite kind="effects" pose={0} className="fire-frame fire-one" />
            <Sprite kind="effects" pose={1} className="fire-frame fire-two" />
            <Sprite kind="effects" pose={2} className="fire-frame fire-three" />
          </div>
        )}
        {hotspots[room].map((h, i) => {
          const p = prop(h.kind);
          const animal = h.kind === "pet" || h.kind === "owl";
          const isProp = p && !(h.kind === "case" && i > 0);
          const label = h.label.replace("Miso", state.pet.name);
          return (
            <button
              key={h.kind + "-" + i}
              className={`scene-object ${animal ? "animal-object" : isProp ? "prop-object" : "fixed-object"}`}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: animal
                  ? room === "bedroom"
                    ? "13%"
                    : "17%"
                  : isProp
                    ? `${p.width}%`
                    : undefined,
              }}
              onClick={() => onInteract(h.kind)}
              aria-label={label}
            >
              {animal ? (
                <PetArt
                  owl={h.kind === "owl" || state.pet.look === "owl"}
                  pose={h.kind === "owl" ? 0 : pose}
                />
              ) : isProp ? (
                <Sprite kind={p.sheet} pose={p.pose} />
              ) : (
                <Sparkles size={20} />
              )}
              <span className="object-tip">{label}</span>
            </button>
          );
        })}
        {room === "attic" && (
          <div className="chest-treasures">
            {state.collectibles.map((id) => (
              <Sprite
                key={id}
                kind="collectibles"
                pose={id === "brass-key" ? 0 : id === "pressed-fern" ? 1 : 2}
              />
            ))}
          </div>
        )}
        {room === "drawing" && (
          <>
            <div className="scene-quill">
              <Sprite kind="desk" pose={5} />
            </div>
            <div className="scene-cup">
              <Sprite kind="desk" pose={4} />
              <Sprite kind="effects" pose={7} className="tea-steam" />
            </div>
            <button
              className="scene-candlestick"
              aria-label="촛불 조명 바꾸기"
              onClick={() => onInteract("candle")}
            >
              <Sprite kind="effects" pose={3} />
              {state.lights && (
                <Sprite kind="effects" pose={4} className="candle-tip" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
