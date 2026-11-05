import { useState } from "react";
import { aiFetch, connection, endpoint, isOutgoing, phaseLabel } from "./ai";
import type { ModuleProps } from "./Post";
import { uid, type Letter, type MailJob } from "./store";

export function AiConnection() {
  const [base, setBase] = useState(() => connection().endpoint),
    [code, setCode] = useState(() => connection().code);
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <details className="ai-connection">
      <summary>AI 우편 연결</summary>
      <p>
        OpenAI 답장은 서버 연결이 필요합니다. 편지를 보낼 때마다 전송 내용을
        먼저 확인합니다.
      </p>
      <label>
        AI 서버 주소
        <input
          type="url"
          value={base}
          placeholder="같은 앱 서버라면 비워 두세요"
          onChange={(e) => setBase(e.target.value)}
        />
      </label>
      <label>
        연결 암호
        <input
          type="password"
          autoComplete="off"
          value={code}
          placeholder="서버 관리자가 정한 연결 암호"
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <p className="muted">
        OpenAI API 키는 서버의 비밀 설정에만 입력하세요. 연결 암호는 이 탭에서만
        기억합니다.
      </p>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setStatus("");
          try {
            const value = endpoint(base);
            localStorage.setItem("ainsworth-ai-endpoint", value);
            sessionStorage.setItem("ainsworth-ai-code", code);
            const health = await aiFetch<{
              configured: boolean;
              model: string;
              maxTokens: number;
              dailyLimit: number;
            }>("status", value);
            if (!health.configured)
              throw Error(
                "서버에 OpenAI 키와 연결 암호가 아직 설정되지 않았어요.",
              );
            const usage = await aiFetch<{ used: number; limit: number }>(
              "usage",
              value,
            );
            setStatus(
              `연결됨 · ${health.model} · 오늘 ${usage.used}/${usage.limit}회 · 답장당 최대 ${health.maxTokens} 출력 토큰`,
            );
          } catch (e) {
            setStatus((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "확인 중…" : "연결 확인"}
      </button>
      {status && <p role="status">{status}</p>}
    </details>
  );
}

export function AiLetter({
  state,
  update,
  notify,
  letter,
  onArrived,
}: ModuleProps & { letter: Letter; onArrived: (id: string) => void }) {
  const [consent, setConsent] = useState(false),
    [included, setIncluded] = useState<string[]>([]);
  const resident = state.residents.find((p) => p.id === letter.person);
  const jobs = (state.mailJobs || []).filter((j) => j.letterId === letter.id);
  const job = jobs.at(-1);
  const active =
    job && ["sending", "queued", "generating", "paused"].includes(job.phase);
  const history = state.letters
    .filter(
      (l) =>
        l.person === letter.person &&
        l.id !== letter.id &&
        l.folder !== "draft",
    )
    .slice(-5);
  const reply = state.letters.find(
    (l) => l.replyTo === letter.id && l.source === "ai",
  );
  if (!isOutgoing(letter) || !resident || letter.folder === "draft")
    return null;
  function begin() {
    if (active) return;
    setIncluded([]);
    setConsent(true);
  }
  function send() {
    if (!resident || active) return;
    if (!connection().code) {
      notify("AI 우편 연결에서 연결 암호를 입력하고 연결을 확인해 주세요.");
      return;
    }
    let server: string;
    try {
      server = endpoint(connection().endpoint);
    } catch (e) {
      notify((e as Error).message);
      return;
    }
    const id = uid();
    const { id: personId, name, relation, year, notes } = resident;
    const newJob: MailJob = {
      id,
      letterId: letter.id,
      endpoint: server,
      phase: "sending",
      submitted: false,
      createdAt: new Date().toISOString(),
      request: {
        id,
        person: { id: personId, name, relation, year, notes },
        date: letter.date,
        letters: [
          ...history.filter((l) => included.includes(l.id)),
          letter,
        ].map((l) => ({
          subject: l.subject,
          body: l.body,
          direction: isOutgoing(l) ? "outgoing" : "incoming",
        })),
      },
    };
    update((s) => ({ ...s, mailJobs: [...(s.mailJobs || []), newJob] }));
    setConsent(false);
  }
  return (
    <section
      className="delivery-card"
      aria-label="편지 배달 상태"
      data-phase={job?.phase || "sealed"}
    >
      <strong>{job ? phaseLabel[job.phase] : "봉인을 마친 편지"}</strong>
      <p>
        {job?.error ||
          (job
            ? "AI가 창작한 답장이 이 앱의 받은 편지함에 도착합니다."
            : "마음을 담은 편지를 보관했어요. 원하면 이 인물에게 OpenAI 답장을 요청할 수 있어요.")}
      </p>
      <div className="button-row">
        {!active && !reply && (
          <button className="primary" onClick={begin}>
            {job?.phase === "failed" ? "새 답장 요청 검토" : "AI 답장 요청"}
          </button>
        )}
        {job?.phase === "paused" && (
          <button
            onClick={() =>
              update((s) => ({
                ...s,
                mailJobs: s.mailJobs?.map((j) =>
                  j.id === job.id
                    ? {
                        ...j,
                        phase: j.submitted ? "queued" : "sending",
                        error: undefined,
                      }
                    : j,
                ),
              }))
            }
          >
            전송 상태 다시 확인
          </button>
        )}
        {reply && (
          <button className="primary" onClick={() => onArrived(reply.id)}>
            도착한 답장 열기{!reply.read && " · 새 편지"}
          </button>
        )}
      </div>
      {consent && (
        <div className="ai-consent">
          <h4>{resident.name}에게 편지 보내기</h4>
          <p>
            OpenAI에 아래 편지 본문과 인물 설정을 보냅니다. 답장 한 번에 유료
            API 요청 한 번을 사용하며, 실패한 요청에도 요금이 발생할 수
            있습니다.
          </p>
          <details>
            <summary>인물 설정 확인</summary>
            <pre>
              {[
                resident.name,
                resident.relation,
                resident.year,
                resident.notes || "추가 메모 없음",
              ].join("\n")}
            </pre>
          </details>
          <details open>
            <summary>이번에 보내는 편지 · {letter.date}</summary>
            <pre>{letter.subject + "\n\n" + letter.body}</pre>
          </details>
          {history.length > 0 && (
            <>
              <p>
                함께 보낼 지난 편지를 직접 선택하세요. 기본으로는 이번 편지 한
                통만 전송합니다.
              </p>
              <div className="history-options">
                {history.map((l) => (
                  <div key={l.id} className="history-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={included.includes(l.id)}
                        onChange={(e) =>
                          setIncluded(
                            e.target.checked
                              ? [...included, l.id]
                              : included.filter((id) => id !== l.id),
                          )
                        }
                      />
                      <span>
                        {isOutgoing(l) ? "내 편지" : "받은 편지"} · {l.subject}
                      </span>
                    </label>
                    <details>
                      <summary>내용 확인</summary>
                      <pre>{l.body}</pre>
                    </details>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="muted">
            첨부 이미지·일기·추리 기록은 전송하지 않습니다. 서버는 답장을 24시간
            보관하며 앱은 수신한 편지를 계속 보관합니다. 이메일이나 실제 우편을
            보내는 기능은 아닙니다.
          </p>
          <div className="button-row">
            <button className="primary" onClick={send}>
              확인한 내용으로 OpenAI에 전송
            </button>
            <button onClick={() => setConsent(false)}>전송 취소</button>
          </div>
        </div>
      )}
    </section>
  );
}
