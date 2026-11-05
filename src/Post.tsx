import { useState } from "react";
import {
  Mail,
  Feather,
  Archive,
  Trash2,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import type { Letter, Resident, State } from "./store";
import { uid } from "./store";
export type ModuleProps = {
  state: State;
  update: (f: (s: State) => State) => void;
  notify: (s: string) => void;
};
export async function readImage(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)
  )
    throw Error("PNG, JPEG, WebP, GIF 이미지를 선택해 주세요.");
  if (file.size > 4 * 1024 * 1024)
    throw Error("이미지는 4MB 이하로 선택해 주세요.");
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(Error("이미지를 읽을 수 없어요."));
    r.readAsDataURL(file);
  });
}
export function Post({
  state,
  update,
  notify,
  profiles = false,
}: ModuleProps & { profiles?: boolean }) {
  const [folder, setFolder] = useState<Letter["folder"]>("inbox"),
    [person, setPerson] = useState("all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [editor, setEditor] = useState<Letter | null>(null),
    [profile, setProfile] = useState<Resident | null>(null),
    [showProfiles, setShowProfiles] = useState(profiles),
    [deleteId, setDeleteId] = useState(""),
    [view, setView] = useState<"text" | "handwriting">("text");
  const letter = state.letters.find((l) => l.id === selected);
  const resident = state.residents.find((p) => p.id === letter?.person);
  const list = state.letters.filter(
    (l) =>
      l.folder === folder &&
      (person === "all" || l.person === person) &&
      `${l.subject} ${l.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  function editNew() {
    setEditor({
      id: uid(),
      person: person === "all" ? state.residents[0].id : person,
      subject: "",
      body: "",
      date: "1994-10-08",
      folder: "draft",
      read: true,
      sample: false,
    });
    setSelected(null);
  }
  function persist(send = false) {
    if (!editor) return;
    if (!editor.subject.trim() || !editor.body.trim()) {
      notify("제목과 본문을 적어 주세요.");
      return;
    }
    const value = {
      ...editor,
      folder: send ? ("sent" as const) : ("draft" as const),
    };
    update((s) => ({
      ...s,
      letters: [...s.letters.filter((l) => l.id !== value.id), value],
    }));
    setEditor(null);
    setFolder(value.folder);
    setSelected(value.id);
    notify(
      send
        ? "보낸 편지함에 기록했어요. 실제 전송이나 자동 답장은 제공하지 않습니다."
        : "임시 보관함에 저장했어요.",
    );
  }
  const signature = letter?.body.split("\n").filter(Boolean).at(-1) || "";
  return (
    <div className="post-module">
      <div className="module-toolbar">
        <div className="tabs">
          {(["inbox", "sent", "draft", "archive"] as const).map((f, i) => (
            <button
              key={f}
              className={folder === f && !showProfiles ? "selected" : ""}
              onClick={() => {
                setFolder(f);
                setSelected(null);
                setEditor(null);
                setShowProfiles(false);
              }}
            >
              {["받은 편지", "보낸 편지", "임시 보관", "보관함"][i]}{" "}
              <small>
                {state.letters.filter((l) => l.folder === f).length}
              </small>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setShowProfiles(!showProfiles);
            setProfile(null);
          }}
        >
          인물 수첩
        </button>
        <button
          className="primary"
          onClick={() => {
            setShowProfiles(false);
            editNew();
          }}
        >
          <Feather size={14} /> 편지 쓰기
        </button>
      </div>
      {showProfiles ? (
        <>
          <p className="muted">
            1994년을 기본 배경으로 사용합니다. 인물의 연도와 관계를 편지의
            날짜에 맞춰 관리하세요. AI 자동 생성은 연결되지 않았습니다.
          </p>
          <div className="profile-layout">
            <div className="profile-list">
              {state.residents.map((p) => (
                <button key={p.id} onClick={() => setProfile({ ...p })}>
                  <span>
                    {p.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  <div>
                    {p.name}
                    <small>{p.relation}</small>
                  </div>
                </button>
              ))}
              <button
                onClick={() =>
                  setProfile({
                    id: uid(),
                    name: "",
                    relation: "",
                    year: "1994",
                    notes: "",
                    paper: "parchment",
                  })
                }
              >
                <Plus size={16} /> 새 인물 추가
              </button>
            </div>
            {profile ? (
              <form
                className="profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!profile.name.trim()) return;
                  update((s) => ({
                    ...s,
                    residents: [
                      ...s.residents.filter((p) => p.id !== profile.id),
                      profile,
                    ],
                  }));
                  notify("인물 수첩을 저장했어요.");
                }}
              >
                <label>
                  이름
                  <input
                    required
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  소속과 관계
                  <input
                    value={profile.relation}
                    onChange={(e) =>
                      setProfile({ ...profile, relation: e.target.value })
                    }
                  />
                </label>
                <label>
                  시대 및 학교 연도
                  <input
                    value={profile.year}
                    onChange={(e) =>
                      setProfile({ ...profile, year: e.target.value })
                    }
                  />
                </label>
                <label>
                  말투와 성격 · 필체 메모
                  <textarea
                    value={profile.notes}
                    onChange={(e) =>
                      setProfile({ ...profile, notes: e.target.value })
                    }
                  />
                </label>
                <label>
                  편지지 스타일
                  <select
                    value={profile.paper}
                    onChange={(e) =>
                      setProfile({ ...profile, paper: e.target.value })
                    }
                  >
                    <option value="parchment">따뜻한 양피지 · 커시브</option>
                    <option value="grey">차분한 회색 · 잉크체</option>
                    <option value="rose">빛바랜 장미 · 커시브</option>
                  </select>
                </label>
                <button className="primary">인물 저장</button>
                <button
                  type="button"
                  onClick={() => {
                    setPerson(profile.id);
                    setFolder("inbox");
                    setShowProfiles(false);
                  }}
                >
                  이 인물의 편지 보기
                </button>
              </form>
            ) : (
              <div className="empty-state">
                <Feather />
                <p>한 사람의 이야기를 펼쳐 보세요.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="filter-row">
            <label>
              인물별 대화
              <select
                value={person}
                onChange={(e) => {
                  setPerson(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="all">모든 인물</option>
                {state.residents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              편지 검색
              <input
                placeholder="제목이나 문장으로 찾기"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="mail-layout">
            <div className="letter-list">
              {list.length ? (
                list.map((l) => (
                  <button
                    key={l.id}
                    className={`${selected === l.id ? "chosen" : ""} ${!l.read ? "unread" : ""}`}
                    onClick={() => {
                      setSelected(l.id);
                      setEditor(null);
                      update((s) => ({
                        ...s,
                        letters: s.letters.map((x) =>
                          x.id === l.id ? { ...x, read: true } : x,
                        ),
                      }));
                    }}
                  >
                    <small>
                      {state.residents.find((p) => p.id === l.person)?.name ||
                        "Unknown correspondent"}
                      <span>{!l.read ? "●" : ""}</span>
                    </small>
                    <strong>{l.subject}</strong>
                    <span>
                      {l.date} · {l.sample ? "예제 편지" : "내가 작성한 편지"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <Mail />
                  <p>아직 이곳에 편지가 없어요.</p>
                  <small>마음에 남은 문장을 적어 보세요.</small>
                </div>
              )}
            </div>
            <div className="letter-detail">
              {editor ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    persist(false);
                  }}
                  className="letter-editor"
                >
                  <span className="eyebrow">A LETTER FROM ELENA</span>
                  <label>
                    수신인
                    <select
                      value={editor.person}
                      onChange={(e) =>
                        setEditor({ ...editor, person: e.target.value })
                      }
                    >
                      {state.residents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    편지 날짜
                    <input
                      required
                      type="date"
                      value={editor.date}
                      onChange={(e) =>
                        setEditor({ ...editor, date: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    제목
                    <input
                      required
                      value={editor.subject}
                      onChange={(e) =>
                        setEditor({ ...editor, subject: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    편지 본문
                    <textarea
                      required
                      rows={9}
                      placeholder="Dear …"
                      value={editor.body}
                      onChange={(e) =>
                        setEditor({ ...editor, body: e.target.value })
                      }
                    />
                  </label>
                  <label className="attachment">
                    <ImageIcon size={16} /> 편지 이미지 첨부 (4MB 이하)
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          try {
                            setEditor({ ...editor, image: await readImage(f) });
                          } catch (err) {
                            notify((err as Error).message);
                          }
                      }}
                    />
                  </label>
                  {editor.image && (
                    <>
                      <img
                        className="attachment-preview"
                        src={editor.image}
                        alt="첨부할 편지"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditor({ ...editor, image: undefined })
                        }
                      >
                        이미지 제거
                      </button>
                    </>
                  )}
                  <div className="button-row">
                    <button className="primary" type="submit">
                      임시 저장
                    </button>
                    <button type="button" onClick={() => persist(true)}>
                      보낸 편지로 기록
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          (!editor.body && !editor.subject) ||
                          confirm("저장하지 않은 편지를 닫을까요?")
                        )
                          setEditor(null);
                      }}
                    >
                      작성 취소
                    </button>
                  </div>
                </form>
              ) : letter ? (
                <>
                  <div className="letter-actions">
                    <span className="badge">
                      {letter.sample ? "예제 편지" : "사용자 작성"} ·{" "}
                      {letter.folder === "sent"
                        ? "로컬 발송 기록"
                        : letter.folder === "draft"
                          ? "임시 보관"
                          : letter.folder === "archive"
                            ? "보관됨"
                            : "도착함"}
                    </span>
                    <button
                      aria-label="읽지 않음으로 표시"
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          letters: s.letters.map((l) =>
                            l.id === letter.id ? { ...l, read: !l.read } : l,
                          ),
                        }))
                      }
                    >
                      <Mail size={15} />
                    </button>
                    <button
                      aria-label="편지 보관"
                      onClick={() => {
                        update((s) => ({
                          ...s,
                          letters: s.letters.map((l) =>
                            l.id === letter.id
                              ? { ...l, folder: "archive" }
                              : l,
                          ),
                        }));
                        setFolder("archive");
                      }}
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      aria-label="편지 삭제"
                      onClick={() => setDeleteId(letter.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="view-tabs">
                    <button
                      onClick={() => setView("text")}
                      aria-pressed={view === "text"}
                    >
                      원문
                    </button>
                    <button
                      onClick={() => setView("handwriting")}
                      aria-pressed={view === "handwriting"}
                    >
                      필기체 이미지
                    </button>
                  </div>
                  <article
                    className={`letter-paper ${resident?.paper || "parchment"}`}
                    key={letter.id}
                  >
                    <div className="wax-seal">A</div>
                    <small>
                      {letter.date} · {resident?.name}
                    </small>
                    <h3>{letter.subject}</h3>
                    {view === "text" ? (
                      <p className="letter-body">{letter.body}</p>
                    ) : (
                      <svg
                        className="handwriting"
                        viewBox={`0 0 650 ${Math.max(300, letter.body.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 58)), 0) * 32 + 60)}`}
                        role="img"
                        aria-label="필기체로 표시한 편지"
                      >
                        <title>{letter.body}</title>
                        <text
                          x="28"
                          y="35"
                          fontFamily={
                            resident?.paper === "grey" ? "Georgia" : "cursive"
                          }
                          fontStyle="italic"
                          fontSize="20"
                          fill="#4f4939"
                        >
                          {letter.body
                            .split("\n")
                            .flatMap(
                              (line) =>
                                line.match(/.{1,58}(?:\s|$)|.{1,58}/g) || [""],
                            )
                            .map((line, i) => (
                              <tspan x="28" dy={i ? 32 : 0} key={i}>
                                {line || " "}
                              </tspan>
                            ))}
                        </text>
                      </svg>
                    )}
                    {letter.image && (
                      <img
                        className="letter-image"
                        src={letter.image}
                        alt={`${letter.subject} 첨부 이미지`}
                      />
                    )}
                    <p className="signature">{signature}</p>
                  </article>
                  <div className="button-row">
                    {!letter.sample && (
                      <button onClick={() => setEditor({ ...letter })}>
                        편지 수정
                      </button>
                    )}
                    <button
                      onClick={() => {
                        update((s) => ({
                          ...s,
                          letters: s.letters.map((l) =>
                            l.id === letter.id
                              ? { ...l, keepsake: !l.keepsake }
                              : l,
                          ),
                        }));
                        notify(
                          letter.keepsake
                            ? "추억함에서 꺼냈어요."
                            : "원본 편지를 침실 추억함에 연결했어요.",
                        );
                      }}
                    >
                      {letter.keepsake
                        ? "추억함에서 꺼내기"
                        : "침실 추억함에 보관"}
                    </button>
                  </div>
                  {deleteId === letter.id && (
                    <div className="confirm-box">
                      이 편지를 영구 삭제할까요? 백업 없이는 복원할 수 없어요.
                      <div className="button-row">
                        <button
                          className="danger"
                          onClick={() => {
                            update((s) => ({
                              ...s,
                              letters: s.letters.filter(
                                (l) => l.id !== deleteId,
                              ),
                            }));
                            setSelected(null);
                            setDeleteId("");
                          }}
                        >
                          삭제 확인
                        </button>
                        <button onClick={() => setDeleteId("")}>취소</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Feather size={36} />
                  <p>A few words can feel like home.</p>
                  <small>편지를 골라 봉인을 열어 보세요.</small>
                </div>
              )}
            </div>
          </div>
          <p className="muted">
            이 우편함은 개인용 로컬 기록입니다. 실제 배송과 AI 자동 답장은
            제공하지 않습니다. 예제는 창작된 가상의 편지입니다.
          </p>
        </>
      )}
    </div>
  );
}
