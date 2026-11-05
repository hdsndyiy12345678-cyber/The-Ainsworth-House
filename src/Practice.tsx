import type { State } from "./store";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Ink } from "./Ink";
import type { ModuleProps } from "./Post";
import type { Stroke } from "./store";
const words = [
  "Ainsworth",
  "Moonlight",
  "Whisper",
  "Garden",
  "Letter",
  "Hearth",
  "Dear Elena",
  "Yours sincerely",
];
const sentences = [
  "A little magic, every day.",
  "A quiet afternoon at Ainsworth House.",
  "There is no place quite like home.",
  "May your days be gentle and bright.",
  "Yours, Elena Ainsworth.",
];
export function Practice({ state, update }: ModuleProps) {
  const [mode, setMode] = useState<"letters" | "words" | "sentences">(
      "letters",
    ),
    [index, setIndex] = useState(0);
  const list =
    mode === "letters"
      ? Array.from(
          { length: 26 },
          (_, i) => String.fromCharCode(65 + i) + String.fromCharCode(97 + i),
        )
      : mode === "words"
        ? words
        : sentences;
  const key = mode + ":" + index;
  const atelier: NonNullable<State["atelier"]> = state.atelier || {
    strokes: [],
    pixels: Array(256).fill(""),
  };
  const strokes =
    atelier.practicePages?.[key] ||
    (mode === "letters" && index === 0 ? atelier.strokes : []);
  function save(strokes: Stroke[]) {
    update((s) => ({
      ...s,
      atelier: {
        ...(s.atelier || atelier),
        practicePages: { ...(s.atelier?.practicePages || {}), [key]: strokes },
      },
    }));
  }
  return (
    <div className="practice-module">
      <div className="practice-tabs">
        {(["letters", "words", "sentences"] as const).map((m, i) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setIndex(0);
            }}
          >
            {["글자", "단어", "문장"][i]}
          </button>
        ))}
      </div>
      <div className="cursive-workspace">
        <nav className="practice-index" aria-label="연습 교본">
          {list.map((text, i) => (
            <button
              key={text}
              aria-current={i === index ? "page" : undefined}
              onClick={() => setIndex(i)}
            >
              {text}
            </button>
          ))}
        </nav>
        <section className="practice-sheet">
          <h3 className="practice-heading">{list[index]}</h3>
          <p className="muted">
            옅은 글씨를 따라 쓰고 빈 줄에서 혼자 써 보세요. 교본마다 획을 따로
            자동 저장합니다.
          </p>
          <Ink
            key={key}
            strokes={strokes}
            onChange={save}
            guide={list[index]}
          />
          <div className="page-nav">
            <span>
              {index + 1} / {list.length} · 내 연습장
            </span>
            <button onClick={() => setIndex((index + 1) % list.length)}>
              다음 교본 <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
