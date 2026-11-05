import { useEffect, useRef } from "react";
import type { AiRequest, Letter, MailJob, State } from "./store";

export const isOutgoing = (letter: Letter) =>
  letter.source !== "ai" && !letter.sample && !letter.receivedAt;
export const letterOrigin = (letter: Letter) =>
  letter.source === "ai"
    ? "AI 창작 답장"
    : letter.sample
      ? "예제 편지"
      : "사용자 작성";
export function endpoint(value: string) {
  const clean = value.trim().replace(/\/$/, "");
  if (!clean) return "";
  const url = new URL(clean);
  if (
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error(
      "서버 주소는 HTTPS 또는 이 기기의 http://127.0.0.1:8788 형식으로 입력해 주세요.",
    );
  return url.origin;
}
export function connection() {
  return {
    endpoint: localStorage.getItem("ainsworth-ai-endpoint") || "",
    code: sessionStorage.getItem("ainsworth-ai-code") || "",
  };
}
class AiHttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function aiFetch<T>(
  path: string,
  base = connection().endpoint,
  payload?: AiRequest,
): Promise<T> {
  if (endpoint(base) !== endpoint(connection().endpoint))
    throw Error(
      "이 편지를 보낸 AI 서버 주소로 연결 설정을 맞춘 뒤 상태를 확인해 주세요.",
    );
  if (window.__AINSWORTH_STANDALONE__ && !base)
    throw Error("다운로드한 HTML에서는 먼저 AI 서버 주소를 연결해 주세요.");
  let response;
  try {
    response = await fetch(endpoint(base) + "/api/ai/" + path, {
      method: payload ? "POST" : "GET",
      cache: "no-store",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "X-Ainsworth-Code": connection().code,
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw Error(
      "AI 서버에 닿지 못했어요. 연결과 암호를 확인한 뒤 전송 상태를 다시 확인해 주세요.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error(
      "AI 서버가 연결되지 않았어요. 서버를 시작하고 주소를 확인해 주세요.",
    );
  }
  if (!response.ok)
    throw new AiHttpError(
      data?.error || "AI 서버 요청을 완료하지 못했어요.",
      response.status,
    );
  return data as T;
}
export type ServerJob = {
  id: string;
  status: "queued" | "generating" | "delivered" | "failed";
  result?: { subject: string; body: string };
  error?: string;
};
export const phaseLabel: Record<MailJob["phase"], string> = {
  sending: "봉인한 편지를 보내는 중",
  queued: "부엉이가 답장을 기다리고 있어요",
  generating: "상대가 답장을 쓰고 있어요",
  delivered: "답장이 도착했어요",
  failed: "답장을 받지 못했어요",
  paused: "전송 상태 확인이 필요해요",
};
export function applyServerJob(
  state: State,
  id: string,
  response: ServerJob,
): State {
  const job = state.mailJobs?.find((j) => j.id === id);
  if (!job || job.phase === "delivered") return state;
  if (response?.id !== id)
    throw Error(
      "요청한 편지와 답장의 전송 ID가 달라요. 전송 상태를 다시 확인해 주세요.",
    );
  if (
    !["queued", "generating", "delivered", "failed"].includes(response.status)
  )
    throw Error("답장 상태가 올바르지 않아요.");
  let letters = state.letters;
  if (response.status === "delivered") {
    if (
      typeof response.result?.subject !== "string" ||
      !response.result.subject.trim() ||
      typeof response.result.body !== "string" ||
      !response.result.body.trim()
    )
      throw Error("완성된 답장을 받지 못했어요.");
    const original = state.letters.find((l) => l.id === job.letterId);
    if (!state.letters.some((l) => l.id === `ai-${id}`))
      letters = [
        ...state.letters,
        {
          id: `ai-${id}`,
          person: job.request.person.id,
          subject: response.result.subject,
          body: response.result.body,
          date: job.request.date,
          folder: "inbox",
          read: false,
          sample: false,
          source: "ai",
          replyTo: job.letterId,
          threadId: original?.threadId || original?.id || job.letterId,
          receivedAt: new Date().toISOString(),
        },
      ];
  }
  return {
    ...state,
    letters,
    mailJobs: state.mailJobs?.map((j) =>
      j.id === id
        ? {
            ...j,
            phase: response.status,
            submitted: true,
            error: response.error,
          }
        : j,
    ),
  };
}

// Mounted at app level so closing the mailbox or opening the map doesn't lose a reply.
export function useMailDelivery(
  state: State,
  ready: boolean,
  update: (f: (s: State) => State) => void,
  notify: (s: string) => void,
  waitForSave: () => Promise<unknown>,
) {
  const current = useRef(state);
  current.current = state;
  const mutator = useRef(update);
  mutator.current = update;
  const announce = useRef(notify);
  announce.current = notify;
  const saved = useRef(waitForSave);
  saved.current = waitForSave;
  const key = (state.mailJobs || [])
    .filter((j) => ["sending", "queued", "generating"].includes(j.phase))
    .map((j) => `${j.id}:${j.phase}`)
    .join(",");
  useEffect(() => {
    if (!ready || !key) return;
    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    async function poll(job: MailJob) {
      try {
        if (job.phase === "sending") await saved.current();
        if (stopped) return;
        // Once the server's idempotency window expires, only look up the old ID.
        // A new generation then requires a fresh content review, never a replayed POST.
        const send =
          job.phase === "sending" &&
          Date.now() - Date.parse(job.createdAt) < 86400000;
        const response = await aiFetch<ServerJob>(
          send ? "jobs" : `jobs/${job.id}`,
          job.endpoint,
          send ? job.request : undefined,
        );
        if (stopped) return;
        // Validate before entering a React state updater.
        applyServerJob(current.current, job.id, response);
        mutator.current((s) => applyServerJob(s, job.id, response));
        if (response.status === "delivered")
          announce.current(
            "부엉이가 새 답장을 가져왔어요. 받은 편지함에서 봉인을 열어 보세요.",
          );
        // Phase changes restart this effect; unchanged states keep polling without another POST.
        if (response.status === job.phase)
          timers.push(
            setTimeout(() => {
              void poll({ ...job, phase: response.status, submitted: true });
            }, 2200),
          );
      } catch (e) {
        if (!stopped)
          mutator.current((s) => ({
            ...s,
            mailJobs: s.mailJobs?.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    phase:
                      e instanceof AiHttpError &&
                      [400, 404, 409, 413, 415, 429].includes(e.status)
                        ? "failed"
                        : "paused",
                    error: (e as Error).message,
                  }
                : j,
            ),
          }));
      }
    }
    for (const job of current.current.mailJobs || [])
      if (["sending", "queued", "generating"].includes(job.phase))
        void poll(job);
    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
    };
  }, [ready, key]);
}
