import Dexie, { type Table } from "dexie";
export const rooms = [
  {
    id: "hall",
    name: "Entrance Hall",
    sub: "문턱에서 시작되는 작은 마법",
    noun: "현관",
    floor: "Ground floor",
  },
  {
    id: "drawing",
    name: "Drawing Room",
    sub: "불빛이 머무는 곳",
    noun: "응접실",
    floor: "Ground floor",
  },
  {
    id: "owlery",
    name: "Owlery",
    sub: "멀리서 도착한 다정한 문장들",
    noun: "부엉이 우편실",
    floor: "West wing",
  },
  {
    id: "bedroom",
    name: "Elena’s Bedroom",
    sub: "아무에게도 말하지 않은 이야기",
    noun: "침실",
    floor: "First floor",
  },
  {
    id: "library",
    name: "Library",
    sub: "오래된 책 속에 남은 흔적",
    noun: "서재",
    floor: "West wing",
  },
  {
    id: "conservatory",
    name: "Conservatory",
    sub: "햇살과 초록이 자라는 오후",
    noun: "온실",
    floor: "Ground floor",
  },
  {
    id: "mystery",
    name: "Mystery Room",
    sub: "모든 비밀에는 흔적이 있다",
    noun: "추리의 방",
    floor: "First floor",
  },
  {
    id: "atelier",
    name: "Atelier",
    sub: "손끝에서 태어나는 작은 세계",
    noun: "작업실",
    floor: "First floor",
  },
  {
    id: "attic",
    name: "Attic",
    sub: "버리지 못한 것들의 다정한 자리",
    noun: "다락방",
    floor: "Second floor",
  },
] as const;
export type RoomId = (typeof rooms)[number]["id"];
export type Stroke = {
  color: string;
  width: number;
  erase: boolean;
  points: { x: number; y: number; p: number }[];
};
export type Resident = {
  id: string;
  name: string;
  relation: string;
  year: string;
  notes: string;
  paper: string;
};
export type Letter = {
  id: string;
  person: string;
  subject: string;
  body: string;
  date: string;
  folder: "inbox" | "sent" | "draft" | "archive";
  read: boolean;
  sample: boolean;
  image?: string;
  keepsake?: boolean;
  source?: "user" | "ai";
  replyTo?: string;
  threadId?: string;
  sentAt?: string;
  receivedAt?: string;
};
export type AiRequest = {
  id: string;
  person: Pick<Resident, "id" | "name" | "relation" | "year" | "notes">;
  date: string;
  letters: {
    subject: string;
    body: string;
    direction: "incoming" | "outgoing";
  }[];
};
export type MailJob = {
  id: string;
  letterId: string;
  endpoint: string;
  phase:
    | "sending"
    | "queued"
    | "generating"
    | "delivered"
    | "failed"
    | "paused";
  submitted: boolean;
  request: AiRequest;
  error?: string;
  createdAt: string;
};
export type Entry = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: string;
  weather: string;
  paper: string;
  sticker: string;
  bookmark: boolean;
  deleted: boolean;
  image?: string;
  strokes: Stroke[];
};
export type State = {
  atelier?: {
    strokes: Stroke[];
    pixels: string[];
    practicePages?: Record<string, Stroke[]>;
    pixelWorks?: { id: string; name: string; pixels: string[] }[];
  };
  version: 1;
  entered: boolean;
  room: RoomId;
  visited: RoomId[];
  time: "auto" | "day" | "dusk" | "night";
  weather: "rain" | "clear";
  sound: boolean;
  motion: boolean;
  lights: boolean;
  fire: boolean;
  pet: {
    name: string;
    look: string;
    bond: number;
    action: string;
    fed?: string;
  };
  letters: Letter[];
  mailJobs?: MailJob[];
  residents: Resident[];
  entries: Entry[];
  cover: string;
  mystery: {
    evidence: string[];
    interviews: string[];
    links: string[];
    hypothesis: string;
    solved: boolean;
    attempts: number;
  };
  plants: number;
  collectibles: string[];
};
export function initialState(): State {
  return {
    version: 1,
    entered: false,
    room: "hall",
    visited: ["hall"],
    time: "auto",
    weather: "rain",
    sound: false,
    motion: true,
    lights: true,
    fire: true,
    pet: { name: "Miso", look: "cat", bond: 12, action: "sitting" },
    letters: [
      {
        id: "welcome",
        person: "hermione",
        subject: "A little something for your library",
        body: "Dear Elena,\n\nI found the most wonderful little book in Flourish and Blotts. There is a pressed fern between pages forty-two and forty-three — do take care not to lose it.\n\nI hope the house is beginning to feel like home. Write when you have a quiet moment.\n\nYours,\nHermione",
        date: "1994-10-08",
        folder: "inbox",
        read: false,
        sample: true,
      },
    ],
    residents: [
      ["harry", "Harry Potter", "Gryffindor · Friend"],
      ["hermione", "Hermione Granger", "Gryffindor · Friend"],
      ["ron", "Ron Weasley", "Gryffindor · Friend"],
      ["snape", "Severus Snape", "Hogwarts · Professor"],
      ["mcgonagall", "Minerva McGonagall", "Hogwarts · Professor"],
      ["draco", "Draco Malfoy", "Slytherin · Acquaintance"],
      ["sirius", "Sirius Black", "Family friend"],
    ].map(([id, name, relation]) => ({
      id,
      name,
      relation,
      year: "1994 · School year 4",
      notes: "",
      paper: id === "snape" ? "grey" : "parchment",
    })),
    entries: [],
    cover: "green",
    mystery: {
      evidence: [],
      interviews: [],
      links: [],
      hypothesis: "",
      solved: false,
      attempts: 0,
    },
    plants: 0,
    collectibles: [],
  };
}
class HouseDB extends Dexie {
  snapshots!: Table<{ id: string; value: State }>;
  constructor() {
    super(
      typeof window !== "undefined" && window.__AINSWORTH_STANDALONE__
        ? "ainsworth-house-preview-v1"
        : "ainsworth-house",
    );
    this.version(1).stores({ snapshots: "id" });
  }
}
export const db = new HouseDB();
export async function loadState() {
  const row = await db.snapshots.get("home");
  return row ? validateBackup(row.value) : initialState();
}
export async function saveState(value: State) {
  await db.snapshots.put({ id: "home", value });
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
export function validateBackup(x: unknown): State {
  if (!object(x) || x.version !== 1)
    throw Error("지원하지 않는 백업 버전입니다.");
  const roomIds = rooms.map((r) => r.id as string);
  if (
    !roomIds.includes(x.room as string) ||
    !Array.isArray(x.visited) ||
    !x.visited.every((r) => roomIds.includes(r)) ||
    !["auto", "day", "dusk", "night"].includes(x.time as string) ||
    !["rain", "clear"].includes(x.weather as string) ||
    !["entered", "sound", "motion", "lights", "fire"].every(
      (k) => typeof x[k] === "boolean",
    ) ||
    !object(x.pet) ||
    typeof x.pet.name !== "string" ||
    !["cat", "owl"].includes(x.pet.look as string) ||
    !Number.isFinite(x.pet.bond) ||
    Number(x.pet.bond) < 0 ||
    Number(x.pet.bond) > 100 ||
    typeof x.pet.action !== "string" ||
    !Array.isArray(x.letters) ||
    !Array.isArray(x.entries) ||
    !Array.isArray(x.residents) ||
    !object(x.mystery) ||
    !Number.isFinite(x.plants) ||
    typeof x.cover !== "string" ||
    !Array.isArray(x.collectibles) ||
    !x.collectibles.every((v) => typeof v === "string")
  )
    throw Error("백업 데이터 구조가 올바르지 않습니다.");
  for (const p of x.residents)
    if (
      !object(p) ||
      !["id", "name", "relation", "year", "notes", "paper"].every(
        (k) => typeof p[k] === "string",
      )
    )
      throw Error("인물 데이터가 손상되었습니다.");
  for (const l of x.letters)
    if (
      !object(l) ||
      !["id", "person", "subject", "body", "date"].every(
        (k) => typeof l[k] === "string",
      ) ||
      !["inbox", "sent", "draft", "archive"].includes(l.folder as string) ||
      typeof l.read !== "boolean" ||
      typeof l.sample !== "boolean" ||
      (l.source !== undefined &&
        !["user", "ai"].includes(l.source as string)) ||
      !["replyTo", "threadId", "sentAt", "receivedAt"].every(
        (k) => l[k] === undefined || typeof l[k] === "string",
      ) ||
      (l.image !== undefined &&
        (typeof l.image !== "string" || !l.image.startsWith("data:image/")))
    )
      throw Error("편지 데이터가 손상되었습니다.");
  if (x.mailJobs !== undefined) {
    if (
      !Array.isArray(x.mailJobs) ||
      new Set(x.mailJobs.map((j) => (object(j) ? j.id : null))).size !==
        x.mailJobs.length
    )
      throw Error("AI 우편 기록이 손상되었습니다.");
    for (const j of x.mailJobs) {
      if (
        !object(j) ||
        !/^[0-9a-f-]{36}$/i.test(String(j.id)) ||
        typeof j.letterId !== "string" ||
        typeof j.endpoint !== "string" ||
        typeof j.createdAt !== "string" ||
        typeof j.submitted !== "boolean" ||
        ![
          "sending",
          "queued",
          "generating",
          "delivered",
          "failed",
          "paused",
        ].includes(j.phase as string) ||
        (j.error !== undefined && typeof j.error !== "string") ||
        !object(j.request)
      )
        throw Error("AI 우편 상태가 손상되었습니다.");
      if (j.endpoint !== "") {
        let u: URL;
        try {
          u = new URL(j.endpoint);
        } catch {
          throw Error("AI 서버 주소가 손상되었습니다.");
        }
        if (
          u.username ||
          u.password ||
          u.search ||
          u.hash ||
          u.pathname !== "/" ||
          (u.protocol !== "https:" &&
            !(
              u.protocol === "http:" &&
              ["localhost", "127.0.0.1"].includes(u.hostname)
            ))
        )
          throw Error("AI 서버 주소가 올바르지 않습니다.");
      }
      const r = j.request;
      if (
        r.id !== j.id ||
        !object(r.person) ||
        !["id", "name", "relation", "year", "notes"].every(
          (k) => typeof (r.person as Record<string, unknown>)[k] === "string",
        ) ||
        typeof r.date !== "string" ||
        !Array.isArray(r.letters) ||
        r.letters.length < 1 ||
        r.letters.length > 6 ||
        !r.letters.every(
          (l) =>
            object(l) &&
            typeof l.subject === "string" &&
            typeof l.body === "string" &&
            ["incoming", "outgoing"].includes(l.direction as string),
        )
      )
        throw Error("AI 전송 내용이 손상되었습니다.");
    }
  }
  for (const e of x.entries) {
    if (
      !object(e) ||
      ![
        "id",
        "date",
        "title",
        "body",
        "mood",
        "weather",
        "paper",
        "sticker",
      ].every((k) => typeof e[k] === "string") ||
      typeof e.bookmark !== "boolean" ||
      typeof e.deleted !== "boolean" ||
      !Array.isArray(e.strokes) ||
      (e.image !== undefined &&
        (typeof e.image !== "string" || !e.image.startsWith("data:image/")))
    )
      throw Error("일기 데이터가 손상되었습니다.");
    for (const s of e.strokes)
      if (
        !object(s) ||
        typeof s.color !== "string" ||
        !Number.isFinite(s.width) ||
        Number(s.width) <= 0 ||
        typeof s.erase !== "boolean" ||
        !Array.isArray(s.points) ||
        !s.points.every(
          (p) =>
            object(p) &&
            ["x", "y", "p"].every(
              (k) => typeof p[k] === "number" && Number.isFinite(p[k]),
            ),
        )
      )
        throw Error("필기 데이터가 손상되었습니다.");
  }
  if (x.atelier !== undefined) {
    if (
      !object(x.atelier) ||
      !Array.isArray(x.atelier.pixels) ||
      x.atelier.pixels.length !== 256 ||
      !x.atelier.pixels.every(
        (c) =>
          typeof c === "string" && (c === "" || /^#[0-9a-fA-F]{6}$/.test(c)),
      ) ||
      !Array.isArray(x.atelier.strokes)
    )
      throw Error("작업실 데이터가 손상되었습니다.");
    for (const s of x.atelier.strokes)
      if (
        !object(s) ||
        typeof s.color !== "string" ||
        !Number.isFinite(s.width) ||
        Number(s.width) <= 0 ||
        typeof s.erase !== "boolean" ||
        !Array.isArray(s.points) ||
        !s.points.every(
          (p) =>
            object(p) &&
            ["x", "y", "p"].every(
              (k) => typeof p[k] === "number" && Number.isFinite(p[k]),
            ),
        )
      )
        throw Error("작업실 필기가 손상되었습니다.");
  }
  if (object(x.atelier)) {
    if (x.atelier.practicePages !== undefined) {
      if (!object(x.atelier.practicePages))
        throw Error("연습장 데이터가 손상되었습니다.");
      for (const strokes of Object.values(x.atelier.practicePages)) {
        if (!Array.isArray(strokes)) throw Error("연습 획이 손상되었습니다.");
        for (const stroke of strokes)
          if (
            !object(stroke) ||
            typeof stroke.color !== "string" ||
            typeof stroke.width !== "number" ||
            !Number.isFinite(stroke.width) ||
            stroke.width <= 0 ||
            typeof stroke.erase !== "boolean" ||
            !Array.isArray(stroke.points) ||
            !stroke.points.every(
              (p) =>
                object(p) &&
                ["x", "y", "p"].every(
                  (k) => typeof p[k] === "number" && Number.isFinite(p[k]),
                ),
            )
          )
            throw Error("연습 획이 손상되었습니다.");
      }
    }
    if (x.atelier.pixelWorks !== undefined) {
      if (
        !Array.isArray(x.atelier.pixelWorks) ||
        !x.atelier.pixelWorks.every(
          (w) =>
            object(w) &&
            typeof w.id === "string" &&
            typeof w.name === "string" &&
            Array.isArray(w.pixels) &&
            w.pixels.length === 256 &&
            w.pixels.every(
              (c) =>
                typeof c === "string" &&
                (c === "" || /^#[0-9a-fA-F]{6}$/.test(c)),
            ),
        ) ||
        new Set(x.atelier.pixelWorks.map((w) => w.id)).size !==
          x.atelier.pixelWorks.length
      )
        throw Error("픽셀 스케치북이 손상되었습니다.");
    }
  }
  const mystery = x.mystery;
  if (
    !["evidence", "interviews", "links"].every(
      (k) =>
        Array.isArray(mystery[k]) &&
        (mystery[k] as unknown[]).every((v) => typeof v === "string"),
    ) ||
    typeof x.mystery.hypothesis !== "string" ||
    typeof x.mystery.solved !== "boolean" ||
    !Number.isFinite(x.mystery.attempts)
  )
    throw Error("사건 데이터가 손상되었습니다.");
  if (
    new Set(x.entries.map((e) => e.id)).size !== x.entries.length ||
    new Set(x.letters.map((l) => l.id)).size !== x.letters.length ||
    new Set(x.residents.map((p) => p.id)).size !== x.residents.length
  )
    throw Error("중복된 기록 ID가 있습니다.");
  return x as unknown as State;
}
export const uid = () => crypto.randomUUID();
export const today = () => new Date().toLocaleDateString("en-CA");
