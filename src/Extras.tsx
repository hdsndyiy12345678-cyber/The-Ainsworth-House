import { useState } from "react";
import { BookOpen, Archive, Sparkles } from "lucide-react";
import { Ink } from "./Ink";
import { CASE } from "./case";
import type { ModuleProps } from "./Post";
import { type State, type Stroke } from "./store";
export function Extras({
  panel,
  state,
  update,
  notify,
}: ModuleProps & { panel: string }) {
  const [book, setBook] = useState("house"),
    [color, setColor] = useState("#536747");
  const atelier = state.atelier || {
    strokes: [],
    pixels: Array(256).fill("") as string[],
  };
  function changeInk(strokes: Stroke[]) {
    update((s) => ({ ...s, atelier: { ...(s.atelier || atelier), strokes } }));
  }
  function pixel(i: number) {
    update((s) => {
      const a = s.atelier || atelier;
      return {
        ...s,
        atelier: {
          ...a,
          pixels: a.pixels.map((c, n) => (i === n ? color : c)),
        },
      };
    });
  }
  if (panel === "practice")
    return (
      <>
        <p className="prose">A quiet afternoon at Ainsworth House.</p>
        <p className="muted">
          문장의 기울기와 이어지는 획을 천천히 따라 써 보세요. 아래 연습장은
          일기와 별도로 자동 저장됩니다.
        </p>
        <div className="cursive-example">
          A quiet afternoon
          <br />
          Yours, Elena Ainsworth
        </div>
        <Ink strokes={atelier.strokes} onChange={changeInk} />
      </>
    );
  if (panel === "pixel")
    return (
      <div className="pixel-module">
        <p className="muted">
          작은 픽셀 정원을 만들어 보세요. 16 × 16 격자와 색은 자동 저장됩니다.
        </p>
        <div className="pixel-palette">
          {[
            "#536747",
            "#b89b67",
            "#60383e",
            "#e9ddc4",
            "#232c3d",
            "#30241d",
            "",
          ].map((c) => (
            <button
              key={c}
              style={{
                background: c || "#fff8e2",
                color: c === "#e9ddc4" || !c ? "#453b2a" : "#fff",
              }}
              aria-label={c ? `색상 ${c}` : "픽셀 지우개"}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
            >
              {!c ? "지우개" : color === c ? "✓" : ""}
            </button>
          ))}
        </div>
        <div className="pixel-grid" aria-label="16 곱하기 16 픽셀 작업판">
          {atelier.pixels.map((c, i) => (
            <button
              key={i}
              aria-label={`${Math.floor(i / 16) + 1}행 ${(i % 16) + 1}열 픽셀`}
              style={{ background: c || "#f3e9d2" }}
              onClick={() => pixel(i)}
            />
          ))}
        </div>
        <button
          onClick={() => {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext("2d")!;
            atelier.pixels.forEach((c, i) => {
              if (c) {
                ctx.fillStyle = c;
                ctx.fillRect((i % 16) * 16, Math.floor(i / 16) * 16, 16, 16);
              }
            });
            const a = document.createElement("a");
            a.download = "elena-pixel-garden.png";
            a.href = canvas.toDataURL();
            a.click();
          }}
        >
          픽셀 그림 PNG 내보내기
        </button>
      </div>
    );
  if (panel === "plant" || panel === "fern")
    return (
      <div className="plant-module">
        <div
          className={`growing-fern grow-${Math.min(3, Math.floor(state.plants / 3))}`}
          aria-hidden="true"
        >
          ❧
        </div>
        <h3>Moonlight Fern</h3>
        <p className="prose">
          해가 지면 잎 끝이 은빛으로 빛나는 작은 양치식물입니다. 물을 주고
          새로운 잎을 관찰해 보세요.
        </p>
        <progress aria-label="식물 성장도" max="10" value={state.plants} />
        <p className="muted">
          돌봄 기록 {state.plants} / 10 ·{" "}
          {state.plants >= 10
            ? "새 잎이 충분히 자랐어요."
            : state.plants >= 3
              ? "작은 잎이 펼쳐지고 있어요."
              : "흙 위로 연한 싹이 올라왔어요."}
        </p>
        <button
          className="primary"
          disabled={state.plants >= 10}
          onClick={() => {
            update((s) => ({ ...s, plants: Math.min(10, s.plants + 1) }));
            notify("뿌리 옆으로 조금씩 물을 주었어요.");
          }}
        >
          물 주고 잎 관찰하기
        </button>
        {state.plants >= 3 && (
          <div className="button-row">
            <button
              disabled={state.collectibles.includes("pressed-fern")}
              onClick={() => {
                update((s) => ({
                  ...s,
                  collectibles: [...s.collectibles, "pressed-fern"],
                }));
                notify("떨어진 잎을 눌러 말려 다락방 상자에 보관했어요.");
              }}
            >
              {state.collectibles.includes("pressed-fern")
                ? "압화 보관 완료"
                : "떨어진 잎을 압화로 보관"}
            </button>
          </div>
        )}
      </div>
    );
  if (panel === "portrait")
    return (
      <div className="portrait-story">
        <div className="old-portrait">
          A<span>1894</span>
        </div>
        <h3>The first light in the house</h3>
        <p className="prose">
          초상화의 모서리에 작은 글씨가 남아 있습니다. “집은 벽으로 완성되는
          것이 아니라, 돌아오는 사람으로 완성된다.” 액자 뒤에는 문양이 새겨진
          오래된 황동 열쇠가 매달려 있습니다.
        </p>
        <button
          className="primary"
          disabled={state.collectibles.includes("brass-key")}
          onClick={() => {
            update((s) => ({
              ...s,
              collectibles: [...s.collectibles, "brass-key"],
            }));
            notify("황동 열쇠를 다락방 상자에 보관했어요.");
          }}
        >
          {state.collectibles.includes("brass-key")
            ? "열쇠 발견 완료"
            : "작은 황동 열쇠 보관"}
        </button>
      </div>
    );
  if (panel === "collection")
    return (
      <>
        <p className="muted">저택을 돌아다니며 직접 보관한 소품들입니다.</p>
        <div className="collection-shelf">
          {[
            [
              "brass-key",
              "⚿",
              "The brass key",
              "오래된 초상화 뒤에서 찾은 저택의 첫 열쇠.",
            ],
            [
              "pressed-fern",
              "❧",
              "A pressed fern",
              "온실에서 직접 돌본 식물의 작은 잎.",
            ],
            [
              "moonstone-badge",
              "◇",
              "Moonstone detective",
              "사라진 월장석 사건을 해결한 기념 증표.",
            ],
          ].map(([id, icon, title, desc]) => (
            <article
              key={id}
              className={
                state.collectibles.includes(id) ? "collected" : "locked"
              }
            >
              <span>{state.collectibles.includes(id) ? icon : "?"}</span>
              <h3>
                {state.collectibles.includes(id)
                  ? title
                  : "아직 발견하지 못한 기억"}
              </h3>
              <p>
                {state.collectibles.includes(id)
                  ? desc
                  : id === "brass-key"
                    ? "서재나 다락방의 초상화를 살펴보세요."
                    : id === "pressed-fern"
                      ? "온실에서 식물을 돌봐 주세요."
                      : "미스터리 사건을 해결해 보세요."}
              </p>
            </article>
          ))}
        </div>
      </>
    );
  if (panel === "keepsakes")
    return (
      <>
        <p className="muted">
          편지함에서 직접 보관한 원본의 참조입니다. 편지 원본을 삭제하면
          이곳에서도 사라집니다.
        </p>
        {state.letters
          .filter((l) => l.keepsake)
          .map((l) => (
            <article className="keepsake-letter" key={l.id}>
              <small>
                {l.date} ·{" "}
                {state.residents.find((p) => p.id === l.person)?.name} ·{" "}
                {l.sample ? "예제" : "사용자 작성"}
              </small>
              <h3>{l.subject}</h3>
              <p>{l.body}</p>
              {l.image && (
                <img
                  src={l.image}
                  className="letter-image"
                  alt="추억 속 편지 첨부"
                />
              )}
              <button
                onClick={() =>
                  update((s) => ({
                    ...s,
                    letters: s.letters.map((x) =>
                      x.id === l.id ? { ...x, keepsake: false } : x,
                    ),
                  }))
                }
              >
                추억함에서 꺼내기
              </button>
            </article>
          ))}
        {!state.letters.some((l) => l.keepsake) && (
          <div className="empty-state">
            <Archive />
            <p>아직 보관한 편지가 없어요.</p>
            <small>Owl Post에서 ‘침실 추억함에 보관’을 눌러 주세요.</small>
          </div>
        )}
      </>
    );
  if (panel === "owl")
    return (
      <div className="empty-state">
        <Sparkles />
        <h3>오늘의 우편은 무사히 도착했어요.</h3>
        <p>부엉이가 조용히 날개를 털고 창가에 앉습니다.</p>
        <small>편지는 Owl Post에서 읽고 기록할 수 있어요.</small>
      </div>
    );
  if (panel === "clues")
    return (
      <>
        <p className="muted">
          미스터리에서 발견한 확정 물증의 참조입니다. 원본 수사 기록은 수정되지
          않습니다.
        </p>
        {CASE.evidence
          .filter((e) => state.mystery.evidence.includes(e.id))
          .map((e) => (
            <article className="library-clue" key={e.id}>
              <small>CASE 001 · {e.time}</small>
              <h3>{e.name}</h3>
              <p>{e.description}</p>
            </article>
          ))}
        {!state.mystery.evidence.length && (
          <div className="empty-state">
            <BookOpen />
            <p>아직 보관된 단서가 없어요.</p>
            <small>Mystery Room에서 첫 사건을 조사해 보세요.</small>
          </div>
        )}
      </>
    );
  return (
    <div className="library-reading">
      <div className="library-bookmarks">
        {[
          ["house", "The Ainsworth House"],
          ["world", "A life in 1994"],
          ["rules", "A note on this world"],
        ].map(([id, title]) => (
          <button
            key={id}
            onClick={() => setBook(id)}
            aria-pressed={book === id}
          >
            {title}
          </button>
        ))}
      </div>
      <article key={book} className="lore-book">
        <small>FROM ELENA’S LIBRARY</small>
        <h3>
          {book === "house"
            ? "The house remembers"
            : book === "world"
              ? "A life in 1994"
              : "Your own little world"}
        </h3>
        <p>
          {book === "house"
            ? "윌트셔의 느릅나무 숲 가장자리에 자리한 에인즈워스 저택. 1894년 처음으로 현관의 불이 밝혀졌다. 참나무 문, 유리 온실, 책 냄새가 남아 있는 서재. 오랫동안 비어 있던 방들이 이제 엘레나를 기다린다."
            : book === "world"
              ? "1994년 가을의 영국. 양피지에 안부를 적고, 젖은 코트를 벽난로 옆에 건다. Owl Post의 기본 편지 날짜는 1994년 10월 8일이다. 인물 수첩에서 학교 연도와 관계를 확인하고 날짜에 맞춰 기록할 수 있다. 일기는 기기의 오늘 날짜로 시작하며 원하는 날짜로 바꿀 수 있다."
              : "이 저택과 엘레나, 저택에 관한 기록, 오리지널 미스터리는 창작된 개인용 세계다. 알려진 인물들에게서 온 예제 편지는 창작 예시로 표시되며 실제 사용자 기록과 구분된다. 이전 채팅 기록은 자동으로 연결되지 않는다. 외부 AI와 실제 우편 서비스도 연결되어 있지 않다."}
        </p>
        <span>❦</span>
      </article>
    </div>
  );
}
export const activityTitles: Record<string, string> = {
  practice: "The writing atelier",
  pixel: "A little pixel garden",
  plant: "The conservatory",
  fern: "Notes on a moonlight fern",
  portrait: "A story behind the frame",
  collection: "The keepsake collection",
  keepsakes: "Elena’s memory box",
  owl: "The little post owl",
  clues: "Collected evidence",
  lore: "From the library",
};
