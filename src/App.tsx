import { HouseNavigation } from "./HouseNavigation";
import { MiniMap, ManorMap } from "./ManorMap";
import { Sprite } from "./Scene";
import { art, installArtTokens } from "./assets";
import { useEffect, useContext, useRef, useState, type ReactNode } from "react";
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
  const nav = useContext(HouseNavigation);
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current!;
    el.focus();
    const handler = (e: KeyboardEvent) => {
      if (
        Array.from(document.querySelectorAll(".modal-backdrop")).at(-1) !==
        el.parentElement
      )
        return;
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
        data-surface={title}
      >
        <header>
          <div>
            <small>THE AINSWORTH HOUSE</small>
            <h2>{title}</h2>
          </div>
          {nav && title !== "The Manor Map" && (
            <button
              className="icon-button modal-map"
              aria-label="저택 지도"
              onClick={nav.openMap}
            >
              <Map size={22} />
            </button>
          )}
          <button className="icon-button" aria-label="닫기" onClick={onClose}>
            <X size={22} />
          </button>
        </header>
        {children}
        {nav && title !== "The Manor Map" && (
          <div className="modal-floating-map">
            <MiniMap room={nav.room} onClick={nav.openMap} />
          </div>
        )}
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
    [mapOpen, setMapOpen] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [activitiesOpen, setActivitiesOpen] = useState(false),
    [opening, setOpening] = useState(false),
    [toast, setToast] = useState(""),
    [tick, setTick] = useState(Date.now());
  const entryButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ready && !state.entered) entryButton.current?.focus();
  }, [ready, state.entered]);
  const saveQueue = useRef(Promise.resolve());
  const revision = useRef(0);
  useEffect(() => {
    installArtTokens();
  }, []);
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
    const rev = ++revision.current;
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveState(state))
      .then(() => {
        if (rev === revision.current) setSaved("모든 순간이 저장되었어요");
      })
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
    setMapOpen(false);
    setMenuOpen(false);
    setActivitiesOpen(false);
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
    if (kind === "map") {
      setMapOpen(true);
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
    <HouseNavigation.Provider
      value={{ openMap: () => setMapOpen(true), go, room: state.room }}
    >
      <div
        className={`app storybook time-${time} ${!state.motion ? "no-motion" : ""}`}
      >
        <main
          className="full-manor"
          inert={!state.entered || !!panel || mapOpen}
        >
          <Scene state={state} time={time} onInteract={interact} />
          <header className="floating-heading">
            <button
              className="paper-icon"
              aria-label="방 목록 열기"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Compass size={24} />
            </button>
            <div>
              <small>The Ainsworth House</small>
              <h1>{current.name}</h1>
            </div>
          </header>
          <div className="floating-controls">
            <button
              className="paper-icon"
              onClick={toggleSound}
              aria-label={state.sound ? "배경음 끄기" : "배경음 켜기"}
            >
              {state.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              className="paper-icon"
              aria-label="설정과 백업"
              onClick={() => setPanel("settings")}
            >
              <Settings size={20} />
            </button>
          </div>
          <button
            className="room-back paper-button"
            onClick={() =>
              state.room === "hall" ? setMapOpen(true) : go("hall")
            }
          >
            <ArrowLeft size={16} />
            {state.room === "hall" ? "저택 지도" : "Entrance Hall"}
          </button>
          {menuOpen && (
            <nav className="room-menu paper-surface" aria-label="저택의 방">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => go(r.id)}
                  aria-label={r.name}
                  aria-current={r.id === state.room ? "page" : undefined}
                >
                  {r.name}
                  <small>{r.noun}</small>
                </button>
              ))}
            </nav>
          )}
          <div className="bottom-actions">
            <button
              className="paper-button"
              onClick={() => setActivitiesOpen(!activitiesOpen)}
              aria-expanded={activitiesOpen}
            >
              <Sparkles size={17} />이 방에서 할 수 있는 일
            </button>
            <button
              className="paper-icon owl-post-shortcut"
              aria-label="우편함 들여다보기"
              onClick={() => {
                go("owlery");
                setPanel("post");
              }}
            >
              <Mail size={21} />
              {state.letters.some((l) => l.folder === "inbox" && !l.read) && (
                <span className="unread-indicator" />
              )}
            </button>
            <button
              className="paper-icon"
              aria-label="Explore the house"
              onClick={() => setMapOpen(true)}
            >
              <Map size={21} />
            </button>
          </div>
          {activitiesOpen && (
            <div
              className="activity-tray paper-surface"
              aria-label="현재 방에서 할 수 있는 일"
            >
              {hotspots[state.room].map((h, i) => (
                <button
                  key={h.kind + i}
                  onClick={() => {
                    interact(h.kind);
                    setActivitiesOpen(false);
                  }}
                >
                  {h.label.replace("Miso", state.pet.name)}
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
          <p className="scene-instruction">
            사물에 손을 뻗어 보세요
            <span>작은 화면에서는 좌우로 둘러볼 수 있어요</span>
          </p>
        </main>
        <div
          className="persistent-tools"
          inert={!state.entered || !!panel || mapOpen}
        >
          <MiniMap room={state.room} onClick={() => setMapOpen(true)} />
        </div>
        <div className="save-indicator" role="status">
          <Check size={11} />
          {saved}
        </div>
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
        {mapOpen && (
          <Modal title="The Manor Map" onClose={() => setMapOpen(false)} wide>
            <ManorMap room={state.room} visited={state.visited} go={go} />
          </Modal>
        )}
        {toast && (
          <div className="toast" role="status">
            <Sparkles size={16} />
            {toast}
          </div>
        )}
      </div>
    </HouseNavigation.Provider>
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
