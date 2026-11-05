import { useState } from "react";
import { BookOpen, Bookmark, Plus } from "lucide-react";
import { Ink } from "./Ink";
import type { ModuleProps } from "./Post";
import { readImage } from "./Post";
import { today, uid, type Entry } from "./store";
export function Diary({ state, update, notify }: ModuleProps) {
  const [selected, setSelected] = useState<string | null>(
      state.entries.find((e) => !e.deleted)?.id || null,
    ),
    [query, setQuery] = useState(""),
    [date, setDate] = useState(""),
    [trash, setTrash] = useState(false),
    [bookmarks, setBookmarks] = useState(false),
    [tab, setTab] = useState("write");
  const entry = state.entries.find((e) => e.id === selected);
  const visible = state.entries
    .filter(
      (e) =>
        e.deleted === trash &&
        (!bookmarks || e.bookmark) &&
        (!date || e.date === date) &&
        `${e.title} ${e.body}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  function patch(value: Partial<Entry>) {
    if (!entry) return;
    update((s) => ({
      ...s,
      entries: s.entries.map((e) =>
        e.id === entry.id ? { ...e, ...value } : e,
      ),
    }));
  }
  function create() {
    const e: Entry = {
      id: uid(),
      date: today(),
      title: "",
      body: "",
      mood: "평온",
      weather: "비",
      paper: "cream",
      sticker: "",
      bookmark: false,
      deleted: false,
      strokes: [],
    };
    update((s) => ({ ...s, entries: [e, ...s.entries] }));
    setSelected(e.id);
    setTrash(false);
    setQuery("");
    setDate("");
    setBookmarks(false);
  }
  const index = visible.findIndex((e) => e.id === selected);
  return (
    <div className={`diary-module cover-${state.cover}`}>
      <div className="module-toolbar">
        <div className="tabs">
          <button
            className={!trash ? "selected" : ""}
            onClick={() => {
              setTrash(false);
              setSelected(null);
            }}
          >
            나의 일기
          </button>
          <button
            className={trash ? "selected" : ""}
            onClick={() => {
              setTrash(true);
              setSelected(null);
            }}
          >
            휴지통 · 복원
          </button>
        </div>
        <label className="cover-select">
          표지
          <select
            value={state.cover}
            onChange={(e) => update((s) => ({ ...s, cover: e.target.value }))}
          >
            <option value="green">포레스트 그린</option>
            <option value="burgundy">버건디</option>
            <option value="navy">미드나이트</option>
          </select>
        </label>
        <button className="primary" onClick={create}>
          <Plus size={14} /> 새 일기
        </button>
      </div>
      <div className="diary-filters">
        <input
          aria-label="일기 검색"
          placeholder="기억 속 문장 찾기"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          aria-label="일기 날짜 필터"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          onClick={() => setBookmarks(!bookmarks)}
          aria-pressed={bookmarks}
        >
          <Bookmark size={15} /> 책갈피
        </button>
      </div>
      <div className="diary-spread">
        <aside className="diary-index">
          <div className="diary-monogram">
            E. A.<span>Private journal</span>
          </div>
          {visible.map((e) => (
            <button
              className={selected === e.id ? "chosen" : ""}
              key={e.id}
              onClick={() => setSelected(e.id)}
            >
              <small>
                {e.date} {e.bookmark ? "✦" : ""}
              </small>
              <span>{e.title || "제목 없는 하루"}</span>
              <em>
                {e.mood} · {e.weather}
              </em>
            </button>
          ))}
          {!visible.length && <p className="muted">아직 기록이 없어요.</p>}
        </aside>
        <div
          className={`diary-page paper-${entry?.paper || "cream"}`}
          key={selected}
        >
          {entry ? (
            <>
              {entry.deleted ? (
                <div className="confirm-box">
                  <p>
                    휴지통에 보관된 일기입니다. 영구 삭제하지 않아 언제든 복원할
                    수 있어요.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      patch({ deleted: false });
                      setTrash(false);
                      notify("일기를 복원했어요.");
                    }}
                  >
                    이 일기 복원
                  </button>
                </div>
              ) : (
                <>
                  <div className="diary-meta">
                    <label>
                      날짜
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => patch({ date: e.target.value })}
                      />
                    </label>
                    <label>
                      마음
                      <select
                        value={entry.mood}
                        onChange={(e) => patch({ mood: e.target.value })}
                      >
                        {[
                          "평온",
                          "설렘",
                          "기쁨",
                          "쓸쓸함",
                          "불안",
                          "고마움",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      날씨
                      <select
                        value={entry.weather}
                        onChange={(e) => patch({ weather: e.target.value })}
                      >
                        {["비", "맑음", "흐림", "눈"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    오늘의 제목
                    <input
                      className="diary-title"
                      placeholder="기억하고 싶은 하루"
                      value={entry.title}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </label>
                  <div className="tabs">
                    <button
                      className={tab === "write" ? "selected" : ""}
                      onClick={() => setTab("write")}
                    >
                      기록
                    </button>
                    <button
                      className={tab === "ink" ? "selected" : ""}
                      onClick={() => setTab("ink")}
                    >
                      손글씨
                    </button>
                    <button
                      className={tab === "references" ? "selected" : ""}
                      onClick={() => setTab("references")}
                    >
                      이날의 편지와 사건
                    </button>
                  </div>
                  {tab === "write" ? (
                    <>
                      <label>
                        <span className="sr-only">일기 본문</span>
                        <textarea
                          className="diary-body"
                          rows={12}
                          placeholder="Dear diary, …"
                          value={entry.body}
                          onChange={(e) => patch({ body: e.target.value })}
                        />
                      </label>
                      <div className="diary-decor">
                        <label>
                          종이
                          <select
                            value={entry.paper}
                            onChange={(e) => patch({ paper: e.target.value })}
                          >
                            <option value="cream">크림</option>
                            <option value="sage">세이지</option>
                            <option value="rose">장미</option>
                          </select>
                        </label>
                        <label>
                          스티커
                          <select
                            value={entry.sticker}
                            onChange={(e) => patch({ sticker: e.target.value })}
                          >
                            {["", "❦", "✦", "☾", "♡", "✿"].map((x) => (
                              <option key={x} value={x}>
                                {x || "없음"}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          aria-pressed={entry.bookmark}
                          onClick={() => patch({ bookmark: !entry.bookmark })}
                        >
                          <Bookmark size={15} /> 책갈피
                        </button>
                      </div>
                      <span className="diary-sticker" aria-label="일기 장식">
                        {entry.sticker}
                      </span>
                      <label className="attachment">
                        사진 첨부 · 4MB 이하
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f)
                              try {
                                patch({ image: await readImage(f) });
                              } catch (err) {
                                notify((err as Error).message);
                              }
                          }}
                        />
                      </label>
                      {entry.image && (
                        <>
                          <img
                            src={entry.image}
                            className="attachment-preview"
                            alt="일기에 첨부한 사진"
                          />
                          <button onClick={() => patch({ image: undefined })}>
                            사진 제거
                          </button>
                        </>
                      )}
                    </>
                  ) : tab === "ink" ? (
                    <Ink
                      key={entry.id}
                      strokes={entry.strokes}
                      onChange={(strokes) => patch({ strokes })}
                    />
                  ) : (
                    <section className="date-references">
                      <p className="muted">
                        원본 기록을 날짜로 참조합니다. 일기에 내용을 자동
                        복사하지 않습니다.
                      </p>
                      {state.letters
                        .filter((l) => l.date === entry.date)
                        .map((l) => (
                          <article key={l.id}>
                            <small>
                              OWL POST · {l.sample ? "예제" : "내 편지"}
                            </small>
                            <h3>{l.subject}</h3>
                            <p>{l.body.slice(0, 180)}</p>
                          </article>
                        ))}
                      {!state.letters.some((l) => l.date === entry.date) && (
                        <p className="muted">이날 기록된 편지가 없습니다.</p>
                      )}
                      {state.mystery.solved && (
                        <p>
                          사건 수첩: The Missing Moonstone은 해결되었습니다.
                          (저택 전체 진행 기록)
                        </p>
                      )}
                    </section>
                  )}
                  <div className="button-row">
                    <button
                      onClick={() => {
                        patch({ deleted: true });
                        setSelected(null);
                        notify(
                          "일기를 휴지통에 보관했어요. 언제든 복원할 수 있어요.",
                        );
                      }}
                    >
                      일기를 휴지통으로
                    </button>
                    <span className="muted">변경 내용은 자동 저장됩니다.</span>
                  </div>
                </>
              )}
              <div className="page-nav">
                <button
                  aria-label="이전 일기"
                  disabled={index <= 0}
                  onClick={() => setSelected(visible[index - 1].id)}
                >
                  ← 이전
                </button>
                <span>
                  {index + 1} / {visible.length}
                </span>
                <button
                  aria-label="다음 일기"
                  disabled={index < 0 || index >= visible.length - 1}
                  onClick={() => setSelected(visible[index + 1].id)}
                >
                  다음 →
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <BookOpen size={38} />
              <p>Not every story needs an audience.</p>
              <small>새 일기를 쓰거나 왼쪽에서 기억을 골라 보세요.</small>
              <button onClick={create}>첫 문장 적기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
