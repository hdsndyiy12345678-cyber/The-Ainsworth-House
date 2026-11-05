import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Feather,
  Flame,
  Home,
  Mail,
  Map,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Scene, { hotspots, PetArt } from "./Scene";
import {
  initialState,
  loadState,
  rooms,
  saveState,
  validateBackup,
  type RoomId,
  type State,
} from "./store";
// Room activities are progressively implemented in Modules.tsx.
import { Activities } from "./Modules";
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current!;
    el.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button,input,select,textarea,a[href],[tabindex="0"]',
          ),
        ).filter(
          (n) => !n.hasAttribute("disabled") && n.getClientRects().length > 0,
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === el)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <header>
          <div>
            <small>THE AINSWORTH HOUSE</small>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose}>
            <X size={22} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const [state, setState] = useState<State>(initialState),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("불러오는 중"),
    [panel, setPanel] = useState(""),
    [opening, setOpening] = useState(false),
    [toast, setToast] = useState(""),
    [tick, setTick] = useState(Date.now());
  const entryButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ready && !state.entered) entryButton.current?.focus();
  }, [ready, state.entered]);
  const saveQueue = useRef(Promise.resolve());
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    loadState()
      .then((s) => {
        const hash = location.hash.slice(1);
        if (rooms.some((r) => r.id === hash)) {
          s.room = hash as RoomId;
          s.visited = [...new Set([...s.visited, s.room])];
        }
        setState(s);
        setReady(true);
      })
      .catch((e) =>
        setError(
          `저장 데이터를 불러오지 못했습니다. 원본을 덮어쓰지 않았습니다. ${e.message}`,
        ),
      );
  }, []);
  useEffect(() => {
    if (!ready) return;
    setSaved("저장 중…");
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveState(state))
      .then(() => setSaved("모든 순간이 저장되었어요"))
      .catch(() => {
        setSaved("저장 실패 — 백업을 내려받아 주세요");
      });
  }, [state, ready]);
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const f = () => {
      const id = location.hash.slice(1) || "hall";
      if (rooms.some((r) => r.id === id)) {
        setState((s) => ({
          ...s,
          room: id as RoomId,
          visited: [...new Set([...s.visited, id as RoomId])],
        }));
        setPanel("");
      }
    };
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (opening) {
      const t = setTimeout(() => {
        setOpening(false);
        setState((s) => ({ ...s, entered: true }));
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [opening]);
  function update(fn: (s: State) => State) {
    setState(fn);
  }
  function go(room: RoomId) {
    history.pushState({}, "", `#${room}`);
    update((s) => ({
      ...s,
      room,
      visited: [...new Set([...s.visited, room])],
      pet: {
        ...s.pet,
        action: ["drawing", "bedroom"].includes(room) ? "happy" : s.pet.action,
      },
    }));
    setPanel("");
  }
  const hour = new Date(tick).getHours();
  const time =
    state.time === "auto"
      ? hour >= 7 && hour < 17
        ? "day"
        : hour >= 17 && hour < 20
          ? "dusk"
          : "night"
      : state.time;
  const current = rooms.find((r) => r.id === state.room)!;
  function interact(kind: string) {
    if (rooms.some((r) => r.id === kind)) {
      go(kind as RoomId);
      return;
    }
    if (kind === "candle") {
      update((s) => ({ ...s, lights: !s.lights }));
      return;
    }
    if (kind === "fire") {
      update((s) => ({ ...s, fire: !s.fire }));
      setToast(
        state.fire
          ? "장작이 잦아들고 방이 고요해졌어요."
          : "마른 참나무 장작이 타오르기 시작해요.",
      );
      return;
    }
    setPanel(kind);
  }
  function toggleSound() {
    if (state.sound) {
      audio.current?.close();
      audio.current = null;
      update((s) => ({ ...s, sound: false }));
      return;
    }
    try {
      const ctx = new AudioContext();
      audio.current = ctx;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const d = buffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.15;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 450;
      src.connect(filter);
      filter.connect(ctx.destination);
      src.start();
      update((s) => ({ ...s, sound: true }));
    } catch {
      setToast("이 브라우저에서는 소리를 시작할 수 없어요.");
    }
  }
  useEffect(
    () => () => {
      audio.current?.close();
    },
    [],
  );
  // A restored setting must not imply playback before a user gesture.
  useEffect(() => {
    if (ready) setState((s) => ({ ...s, sound: false }));
  }, [ready]);
  if (error)
    return (
      <main className="loading">
        <h1>기록을 안전하게 지키고 있어요.</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>다시 불러오기</button>
      </main>
    );
  if (!ready)
    return (
      <main className="loading">
        <Feather />
        <p>저택의 불을 밝히는 중…</p>
      </main>
    );
  return (
    <div className={`app time-${time} ${!state.motion ? "no-motion" : ""}`}>
      <aside className="sidebar" inert={!state.entered}>
        <a
          className="brand"
          href="#hall"
          onClick={(e) => {
            e.preventDefault();
            go("hall");
          }}
          aria-label="The Ainsworth House 현관"
        >
          <div className="crest">
            A<span>✧</span>
          </div>
          <div>
            THE AINSWORTH<span>HOUSE</span>
          </div>
          <small>EST. 1894 · WILTSHIRE</small>
        </a>
        <div className="resident">
          <span className="avatar">E</span>
          <div>
            Elena Ainsworth<small>이 저택의 주인</small>
          </div>
          <span className="resident-dot" />
        </div>
        <p className="nav-label">YOUR LITTLE WORLD</p>
        <nav aria-label="저택의 방">
          {rooms.map((r, i) => {
            const Icon = [
              Home,
              Flame,
              Mail,
              Moon,
              BookOpen,
              Sun,
              Compass,
              Feather,
              Sparkles,
            ][i];
            return (
              <button
                key={r.id}
                className={`nav-room ${state.room === r.id ? "active" : ""}`}
                onClick={() => go(r.id)}
                aria-current={state.room === r.id ? "page" : undefined}
              >
                <Icon size={17} />
                <span>{r.name}</span>
                {r.id === "owlery" &&
                  state.letters.some(
                    (l) => l.folder === "inbox" && !l.read,
                  ) && <span className="mail-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setPanel("map")}>
            <Map size={17} />
            저택 지도<span>↗</span>
          </button>
          <button onClick={() => setPanel("settings")}>
            <Settings size={17} />
            설정과 백업
          </button>
          <p>
            Some places are a little more
            <br />
            than just a place.
          </p>
          <span>❦</span>
        </div>
      </aside>
      <main className="main" inert={!state.entered}>
        <header className="topbar">
          <div>
            <span className="tiny-star">✧</span> A place to call your own
          </div>
          <div className="top-actions">
            <span className="weather-label">
              {state.weather === "rain" ? "가벼운 비" : "맑은 하늘"}{" "}
              <span>·</span>{" "}
              {time === "day"
                ? "오후의 햇살"
                : time === "dusk"
                  ? "해 질 녘"
                  : "고요한 밤"}
            </span>
            <button
              className="icon-button"
              onClick={toggleSound}
              aria-label={state.sound ? "배경음 끄기" : "배경음 켜기"}
            >
              {state.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              className="icon-button mobile-map"
              onClick={() => setPanel("map")}
              aria-label="저택 지도"
            >
              <Map size={20} />
            </button>
          </div>
        </header>
        <section className="room-heading">
          <div>
            <div className="eyebrow">WELCOME HOME, ELENA</div>
            <h1>
              {current.name}
              <span>✧</span>
            </h1>
            <p>{current.sub}</p>
          </div>
          <button className="outline-button" onClick={() => setPanel("map")}>
            <Map size={16} /> Explore the house <ChevronRight size={15} />
          </button>
        </section>
        <div className="scene-frame">
          <div key={state.room} className={`scene scene-${state.room}`}>
            <Scene
              room={state.room}
              fire={state.fire}
              lights={state.lights}
              petLook={state.pet.look}
            />
            <div className="light-wash" />
            {state.weather === "rain" && (
              <div className="rain" aria-hidden="true" />
            )}
            <span className="scene-location">
              <span /> {current.floor} <i>·</i> {current.noun}
            </span>
            <div className="scene-caption">
              <span>MAKE YOURSELF AT HOME</span>
              <p>
                {state.room === "hall"
                  ? "문 너머로, 당신만의 이야기가 기다리고 있어요."
                  : state.room === "drawing"
                    ? "차가 식기 전에, 잠시 쉬어 가요."
                    : "마음이 이끄는 곳에 잠시 머물러 보세요."}
              </p>
            </div>
            {hotspots[state.room].map((h) => (
              <button
                key={h.kind}
                className="hotspot"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                onClick={() => interact(h.kind)}
                aria-label={h.label}
              >
                <span>✧</span>
                <span className="hotspot-label">{h.label}</span>
              </button>
            ))}
            <button
              className="scene-back"
              onClick={() => {
                if (state.room === "hall") setPanel("map");
                else go("hall");
              }}
            >
              <ArrowLeft size={15} />
              {state.room === "hall" ? "저택 지도" : "Entrance Hall"}
            </button>
            <span className="scene-hint">✧ 빛나는 사물을 눌러 보세요</span>
          </div>
        </div>
        <section className="below-scene">
          <div className="house-note">
            <span className="note-ornament">❧</span>
            <div>
              <small>A LITTLE NOTE FROM THE HOUSE</small>
              <p>
                {state.room === "hall"
                  ? "서두르지 않아도 괜찮아요. 이곳의 시간은 당신의 것이니까요."
                  : state.room === "drawing"
                    ? `${state.pet.name}가 당신이 돌아오기를 기다리고 있었어요.`
                    : "작은 발견 하나가 오래도록 남을 추억이 되기도 하죠."}
              </p>
            </div>
          </div>
          <button
            className="post-note"
            onClick={() => {
              go("owlery");
              setPanel("post");
            }}
          >
            <div className="envelope-icon">
              <Mail size={27} />
              <span />
            </div>
            <div>
              <small>OWL POST</small>
              <p>
                {state.letters.filter((l) => l.folder === "inbox" && !l.read)
                  .length
                  ? "당신에게 도착한 편지가 있어요"
                  : "다정한 안부를 보내 볼까요?"}
              </p>
              <span>
                우편함 들여다보기 <span>↗</span>
              </span>
            </div>
          </button>
        </section>
        <div className="object-nav" aria-label="현재 방에서 할 수 있는 일">
          {hotspots[state.room].map((h) => (
            <button key={h.kind} onClick={() => interact(h.kind)}>
              {h.label}
              <ChevronRight size={13} />
            </button>
          ))}
        </div>
        <footer className="footer">
          <span>
            <Check size={12} /> {saved}
          </span>
          <span>
            Wiltshire, England <i>·</i> Your own kind of magic
          </span>
        </footer>
      </main>
      {!state.entered && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="저택에 오신 것을 환영합니다"
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              const nodes = Array.from(
                e.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
              ).filter((b) => b.getClientRects().length > 0);
              if (e.shiftKey && document.activeElement === nodes[0]) {
                e.preventDefault();
                nodes.at(-1)?.focus();
              } else if (
                !e.shiftKey &&
                document.activeElement === nodes.at(-1)
              ) {
                e.preventDefault();
                nodes[0]?.focus();
              }
            }
          }}
          className={`intro ${opening ? "opening" : ""}`}
        >
          {opening && (
            <button
              className="animation-skip"
              onClick={() => {
                setOpening(false);
                update((s) => ({ ...s, entered: true }));
              }}
            >
              문 열림 건너뛰기 →
            </button>
          )}
          <div className="intro-door left-door" />
          <div className="intro-door right-door" />
          <div className="intro-content">
            <div className="crest">
              A<span>✧</span>
            </div>
            <div className="eyebrow">WILTSHIRE, ENGLAND · EST. 1894</div>
            <h1>
              The Ainsworth
              <br />
              <em>House</em>
            </h1>
            <p>조금 오래된 저택, 그리고 당신만의 마법.</p>
            <button
              ref={entryButton}
              className="gold-button"
              onClick={() => {
                if (
                  !state.motion ||
                  matchMedia("(prefers-reduced-motion: reduce)").matches
                )
                  update((s) => ({ ...s, entered: true }));
                else setOpening(true);
              }}
            >
              저택의 문 열기 <ChevronRight size={16} />
            </button>
            <button
              className="skip"
              onClick={() => {
                setOpening(false);
                update((s) => ({ ...s, entered: true }));
              }}
            >
              인트로 건너뛰기 →
            </button>
          </div>
        </div>
      )}
      {panel === "map" && (
        <Modal title="The Manor Map" onClose={() => setPanel("")} wide>
          <p className="muted">
            빛이 켜진 방은 당신이 머물렀던 곳이에요. 어느 문이든 열어 보세요.
          </p>
          <div className="manor-map">
            {["Second floor", "First floor", "West wing", "Ground floor"].map(
              (f) => (
                <div className="map-floor" key={f}>
                  <small>{f}</small>
                  <div>
                    {rooms
                      .filter((r) => r.floor === f)
                      .map((r) => (
                        <button
                          className={`${state.visited.includes(r.id) ? "visited" : ""} ${state.room === r.id ? "here" : ""}`}
                          onClick={() => go(r.id)}
                          key={r.id}
                        >
                          <span>
                            {state.room === r.id
                              ? "✦"
                              : state.visited.includes(r.id)
                                ? "✧"
                                : "◇"}
                          </span>
                          <strong>{r.name}</strong>
                          <small>{r.noun}</small>
                          {state.room === r.id && <em>YOU ARE HERE</em>}
                        </button>
                      ))}
                  </div>
                </div>
              ),
            )}
          </div>
          <p className="muted">
            탐험한 방 {state.visited.length} / {rooms.length}
          </p>
        </Modal>
      )}
      {panel === "settings" && (
        <Modal title="A few little preferences" onClose={() => setPanel("")}>
          <SettingsPanel state={state} update={update} notify={setToast} />
        </Modal>
      )}
      {panel === "window" && (
        <Modal title="Beyond the window" onClose={() => setPanel("")}>
          <p className="prose">
            윌트셔의 오래된 느릅나무 너머로{" "}
            {state.weather === "rain"
              ? "빗방울이 유리창을 두드립니다."
              : "맑은 하늘이 펼쳐집니다."}{" "}
            저택 안에서는 천천히 흘러가는 시간을 골라도 좋아요.
          </p>
          <label>
            창밖의 날씨
            <select
              value={state.weather}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  weather: e.target.value as State["weather"],
                }))
              }
            >
              <option value="rain">가벼운 비</option>
              <option value="clear">맑은 날</option>
            </select>
          </label>
        </Modal>
      )}
      {panel && !["map", "settings", "window"].includes(panel) && (
        <Activities
          panel={panel}
          state={state}
          update={update}
          onClose={() => setPanel("")}
          notify={setToast}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Sparkles size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function SettingsPanel({
  state,
  update,
  notify,
}: {
  state: State;
  update: (f: (s: State) => State) => void;
  notify: (s: string) => void;
}) {
  const [pending, setPending] = useState<State | null>(null),
    [problem, setProblem] = useState("");
  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ainsworth-house-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify("백업 파일을 내려받았어요.");
  }
  return (
    <div className="settings-content">
      <label>
        저택의 시간
        <select
          value={state.time}
          onChange={(e) =>
            update((s) => ({ ...s, time: e.target.value as State["time"] }))
          }
        >
          <option value="auto">기기 시간에 맞추기</option>
          <option value="day">낮</option>
          <option value="dusk">해 질 녘</option>
          <option value="night">밤</option>
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={state.motion}
          onChange={(e) => update((s) => ({ ...s, motion: e.target.checked }))}
        />{" "}
        애니메이션 사용 (기기의 모션 감소 설정을 우선합니다)
      </label>
      <hr />
      <h3>기억을 안전하게 보관하기</h3>
      <p className="muted">
        기록과 이미지, 벡터 필기는 이 브라우저의 IndexedDB에 저장됩니다. 기기 간
        자동 동기화는 제공하지 않습니다. 브라우저 데이터를 지우기 전에 백업해
        주세요.
      </p>
      <button className="primary" onClick={download}>
        JSON 백업 내보내기
      </button>
      <label className="file-label">
        백업 가져오기
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 30 * 1024 * 1024)
                throw Error("30MB 이하 백업을 선택해 주세요.");
              setPending(validateBackup(JSON.parse(await file.text())));
              setProblem("");
            } catch (err) {
              setProblem((err as Error).message);
            }
            e.target.value = "";
          }}
        />
      </label>
      {problem && (
        <p role="alert" className="error">
          {problem}
        </p>
      )}
      {pending && (
        <div className="confirm-box">
          <p>
            일기 {pending.entries.length}개, 편지 {pending.letters.length}개가
            있는 백업입니다. 현재의 모든 기록을 덮어씁니다. 먼저 현재 백업을
            내려받아 주세요.
          </p>
          <button
            className="danger"
            onClick={() => {
              update(() => pending);
              setPending(null);
              notify("백업을 복원했어요.");
            }}
          >
            현재 기록을 덮어쓰고 복원
          </button>
          <button onClick={() => setPending(null)}>취소</button>
        </div>
      )}
      <p className="muted">
        데이터 형식 v1 · 실제 편지와 예제 편지는 별도로 표시됩니다.
        <br />
        AI 자동 답장과 외부 API는 연결되지 않았습니다.
      </p>
    </div>
  );
}
