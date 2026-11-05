import { Sprite } from "./Scene";
import { useState } from "react";
import { Check, Search, Link as LinkIcon } from "lucide-react";
import { CASE, judgeDeduction } from "./case";
import type { ModuleProps } from "./Post";
export function Mystery({ state, update, notify }: ModuleProps) {
  const [tab, setTab] = useState("overview"),
    [suspect, setSuspect] = useState(""),
    [pair, setPair] = useState<string[]>([]),
    [result, setResult] = useState(""),
    [caseOpen, setCaseOpen] = useState(false);
  const m = state.mystery;
  function evidence(id: string) {
    if (!m.evidence.includes(id)) {
      update((s) => ({
        ...s,
        mystery: { ...s.mystery, evidence: [...s.mystery.evidence, id] },
      }));
      notify(
        "확정된 단서를 수사 수첩에 기록했어요. Library에서도 참조할 수 있습니다.",
      );
    }
  }
  return (
    <div className="mystery-module">
      {!caseOpen ? (
        <button className="case-cover" onClick={() => setCaseOpen(true)}>
          <div className="case-number">CASE No. 001</div>
          <div className="moonstone">
            <Sprite kind="collectibles" pose={2} />
          </div>
          <h3>{CASE.name}</h3>
          <p>서쪽 도서관의 사라진 월장석</p>
          <small>{CASE.date} · ORIGINAL FICTION</small>
          <span>{m.solved ? "해결 기록 다시 읽기" : "사건 파일 열기"} →</span>
        </button>
      ) : (
        <>
          <div className="case-title">
            <div>
              <small>CASE No. 001 · ORIGINAL FICTION</small>
              <h3>{CASE.name}</h3>
            </div>
            <span className="badge">
              {m.solved ? "해결됨" : "조사 중"} · 물증 {m.evidence.length}/
              {CASE.evidence.length}
            </span>
          </div>
          <progress
            aria-label="조사 진행도"
            className="case-progress"
            max="8"
            value={m.evidence.length + m.interviews.length}
          />
          <div className="tabs case-tabs">
            {[
              ["overview", "사건 개요"],
              ["evidence", "증거 수집"],
              ["suspects", "용의자와 심문"],
              ["timeline", "시간과 알리바이"],
              ["board", "추리 보드"],
              ["deduction", "추론 제출"],
            ].map(([id, name]) => (
              <button
                key={id}
                className={tab === id ? "selected" : ""}
                onClick={() => setTab(id)}
              >
                {name}
              </button>
            ))}
          </div>
          {tab === "overview" && (
            <div className="case-overview">
              <p className="eyebrow">
                {CASE.location} · {CASE.date}
              </p>
              <h3>잠긴 전시함, 온전한 봉인.</h3>
              <p className="prose">{CASE.summary}</p>
              <div className="case-rules">
                <p>조사 규칙</p>
                <ol>
                  <li>장소를 조사하고 확정 물증을 수집하세요.</li>
                  <li>세 사람을 심문하고 진술과 알리바이를 비교하세요.</li>
                  <li>보드에 단서를 연결하고 수단과 동기를 제출하세요.</li>
                </ol>
                <p className="muted">
                  사건의 진실과 과거 사실은 선택이나 백업으로 바뀌지 않습니다.
                  이 사건은 오리지널 창작이며 이전 채팅의 사건을 이어 쓰지
                  않습니다.
                </p>
              </div>
              <button className="primary" onClick={() => setTab("evidence")}>
                첫 장소 조사하기 <Search size={14} />
              </button>
            </div>
          )}
          {tab === "evidence" && (
            <div className="evidence-desk">
              {CASE.evidence.map((e, i) => (
                <article
                  className={`evidence-slip ${m.evidence.includes(e.id) ? "found" : ""}`}
                  key={e.id}
                >
                  <small>
                    EXHIBIT {String(i + 1).padStart(2, "0")} · {e.place}
                  </small>
                  <h3>
                    {m.evidence.includes(e.id)
                      ? e.name
                      : "아직 조사하지 않은 장소"}
                  </h3>
                  {m.evidence.includes(e.id) ? (
                    <>
                      <Sprite
                        kind={e.id === "seal" ? "desk" : "collectibles"}
                        pose={
                          e.id === "key"
                            ? 0
                            : e.id === "dust"
                              ? 2
                              : e.id === "greenhouse"
                                ? 1
                                : 0
                        }
                        className="evidence-illustration"
                      />
                      <p>{e.description}</p>
                      <span>
                        {e.time} · {e.reliability}
                      </span>
                      <div className="found-mark">
                        <Check size={14} /> 수집 완료 · Library 참조 가능
                      </div>
                    </>
                  ) : (
                    <>
                      <p>이 장소에 남은 흔적을 자세히 살펴보세요.</p>
                      <button onClick={() => evidence(e.id)}>
                        이곳 조사하기
                      </button>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
          {tab === "suspects" && (
            <div className="suspect-pages">
              {CASE.suspects.map((s) => (
                <article key={s.id}>
                  <div className="suspect-avatar">
                    {s.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <small>{s.house}</small>
                  <h3>{s.name}</h3>
                  <p>{s.note}</p>
                  {m.interviews.includes(s.id) ? (
                    <blockquote>
                      “{s.statement}”<small>진술 신뢰도: {s.reliability}</small>
                    </blockquote>
                  ) : (
                    <button
                      onClick={() =>
                        update((prev) => ({
                          ...prev,
                          mystery: {
                            ...prev.mystery,
                            interviews: [...prev.mystery.interviews, s.id],
                          },
                        }))
                      }
                    >
                      심문하고 진술 기록
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          {tab === "timeline" && (
            <div className="case-timeline">
              <h3>확정된 시간 기록</h3>
              {CASE.timeline.map((t) => (
                <div key={t.time}>
                  <time>{t.time}</time>
                  <p>{t.text}</p>
                </div>
              ))}
              {CASE.evidence
                .filter((e) => m.evidence.includes(e.id))
                .map((e) => (
                  <div key={e.id}>
                    <time>{e.time}</time>
                    <p>
                      {e.name}
                      <small>{e.description}</small>
                    </p>
                  </div>
                ))}
              <h3>알리바이 교차 확인</h3>
              {CASE.suspects.map((s) => (
                <article key={s.id}>
                  <strong>{s.name}</strong>
                  <p>
                    {m.interviews.includes(s.id) &&
                    (s.id === "theo"
                      ? m.evidence.includes("key")
                      : m.evidence.includes(
                          s.id === "mara" ? "greenhouse" : "receipt",
                        ))
                      ? s.alibi
                      : "진술과 관련 물증을 모두 확보하면 확인할 수 있습니다."}
                  </p>
                </article>
              ))}
            </div>
          )}
          {tab === "board" && (
            <div className="deduction-board">
              <p className="muted">
                두 단서를 선택해 실로 연결하세요. 연결은 나의 가설이며 확정
                사실에 영향을 주지 않습니다.
              </p>
              <div className="board-pins">
                {CASE.evidence
                  .filter((e) => m.evidence.includes(e.id))
                  .map((e) => (
                    <button
                      key={e.id}
                      aria-pressed={pair.includes(e.id)}
                      onClick={() =>
                        setPair(
                          pair.includes(e.id)
                            ? pair.filter((p) => p !== e.id)
                            : [...pair.slice(-1), e.id],
                        )
                      }
                    >
                      <span>●</span>
                      {e.name}
                    </button>
                  ))}
              </div>
              <button
                disabled={pair.length !== 2}
                className="primary"
                onClick={() => {
                  const key = [...pair].sort().join(":");
                  if (!m.links.includes(key))
                    update((s) => ({
                      ...s,
                      mystery: {
                        ...s.mystery,
                        links: [...s.mystery.links, key],
                      },
                    }));
                  setPair([]);
                }}
              >
                <LinkIcon size={14} /> 선택한 단서 연결
              </button>
              <div className="board-connections">
                {m.links.map((link) => (
                  <div key={link}>
                    <span>
                      {link
                        .split(":")
                        .map(
                          (id) =>
                            CASE.evidence.find((e) => e.id === id)?.name ||
                            "알 수 없는 단서",
                        )
                        .join(" ─── ")}
                    </span>
                    <button
                      aria-label="단서 연결 해제"
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          mystery: {
                            ...s.mystery,
                            links: s.mystery.links.filter((l) => l !== link),
                          },
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {!m.evidence.length && <p>먼저 물증을 수집해 주세요.</p>}
            </div>
          )}
          {tab === "deduction" && (
            <div className="deduction-form">
              {m.solved ? (
                <>
                  <div className="solved-stamp">CASE CLOSED</div>
                  <h3>월장석이 돌아왔다.</h3>
                  <p className="prose">{CASE.truth.action}</p>
                  <p className="prose">
                    {CASE.truth.method} {CASE.truth.motive} 월장석은 망원경
                    상자에서 회수되었고, Theo는 사서에게 사과했다.
                  </p>
                  <label>
                    내가 남긴 추론
                    <textarea readOnly value={m.hypothesis} />
                  </label>
                  <button
                    className="primary"
                    disabled={state.collectibles.includes("moonstone-badge")}
                    onClick={() => {
                      update((s) => ({
                        ...s,
                        collectibles: [...s.collectibles, "moonstone-badge"],
                      }));
                      notify("월장석 탐정 증표를 다락방 상자에 보관했어요.");
                    }}
                  >
                    {state.collectibles.includes("moonstone-badge")
                      ? "기념 증표 보관 완료"
                      : "기념 증표를 다락방에 보관"}
                  </button>
                </>
              ) : (
                <>
                  <p className="muted">
                    세 가지 이상의 단서를 수집하고 열쇠와 은빛 가루의 의미를
                    설명해 주세요. 틀려도 기록은 사라지지 않아요.
                  </p>
                  <label>
                    누가 가져갔을까요?
                    <select
                      value={suspect}
                      onChange={(e) => setSuspect(e.target.value)}
                    >
                      <option value="">용의자 선택</option>
                      {CASE.suspects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    수단과 동기
                    <textarea
                      rows={6}
                      value={m.hypothesis}
                      placeholder="물증과 진술을 연결해 설명해 주세요."
                      onChange={(e) =>
                        update((s) => ({
                          ...s,
                          mystery: { ...s.mystery, hypothesis: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <button
                    className="primary"
                    disabled={!suspect}
                    onClick={() => {
                      const result = judgeDeduction(
                        suspect,
                        m.evidence,
                        m.hypothesis,
                      );
                      setResult(result.message);
                      update((s) => ({
                        ...s,
                        mystery: {
                          ...s.mystery,
                          attempts: s.mystery.attempts + 1,
                          solved: result.solved,
                        },
                      }));
                    }}
                  >
                    추론 제출
                  </button>
                  <p className="muted">제출 기록 {m.attempts}회</p>
                </>
              )}
              {result && (
                <p className="deduction-result" role="status">
                  {result}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
