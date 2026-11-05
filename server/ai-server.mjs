import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  ApiError,
  authorized,
  createQueue,
  openAIReply,
  MODEL,
  MAX_TOKENS,
} from "./ai-core.mjs";

export async function createAiServer({
  key,
  accessCode,
  directory = ".ainsworth-ai",
  origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ],
  dailyLimit = 20,
  generate,
} = {}) {
  const configured = Boolean(key && accessCode);
  const queue = await createQueue({
    directory,
    dailyLimit,
    generate: async (p) => {
      if (!configured)
        throw new ApiError(
          503,
          "서버에 OpenAI 키와 연결 암호를 설정한 뒤 다시 요청해 주세요.",
        );
      return generate ? generate(p) : openAIReply(p, { key });
    },
  });
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const origin = req.headers.origin;
    const allowed = origins.includes(origin);
    const respond = (status, value) => {
      res.writeHead(status);
      res.end(JSON.stringify(value));
    };
    // Standalone file origins are explicitly enabled, not silently trusted.
    if (origin && !allowed)
      return respond(403, {
        error: "이 앱 주소는 AI 서버의 허용 목록에 없어요.",
      });
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-Ainsworth-Code",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (req.method === "GET" && path === "/api/ai/status")
        return respond(200, {
          configured,
          model: MODEL,
          maxTokens: MAX_TOKENS,
          dailyLimit,
        });
      if (!path.startsWith("/api/ai/"))
        throw new ApiError(404, "없는 주소입니다.");
      if (!configured)
        throw new ApiError(
          503,
          "서버에 OpenAI 키와 연결 암호를 설정해 주세요.",
        );
      if (!authorized(req.headers["x-ainsworth-code"], accessCode))
        throw new ApiError(
          401,
          "연결 암호를 확인해 주세요. OpenAI API 키를 입력하는 칸이 아닙니다.",
        );
      if (req.method === "GET" && path === "/api/ai/usage")
        return respond(200, queue.usage());
      if (
        req.method === "GET" &&
        /^\/api\/ai\/jobs\/[0-9a-f-]{36}$/i.test(path)
      )
        return respond(200, await queue.get(path.split("/").at(-1)));
      if (req.method === "POST" && path === "/api/ai/jobs") {
        if (!req.headers["content-type"]?.startsWith("application/json"))
          throw new ApiError(415, "JSON 형식으로 보내 주세요.");
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          chunks.push(chunk);
          bytes += chunk.length;
          if (bytes > 80000)
            throw new ApiError(413, "편지 내용이 너무 길어요.");
        }
        const body = Buffer.concat(chunks).toString("utf8");
        let value;
        try {
          value = JSON.parse(body);
        } catch {
          throw new ApiError(400, "편지 형식이 올바르지 않아요.");
        }
        return respond(202, await queue.submit(value));
      }
      throw new ApiError(404, "없는 주소입니다.");
    } catch (e) {
      respond(e instanceof ApiError ? e.status : 500, {
        error:
          e instanceof ApiError
            ? e.message
            : "서버 기록을 저장하지 못했어요. 원본 편지는 앱에 남아 있습니다.",
      });
    }
  });
  return { server, queue };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const port = Number(process.env.AINSWORTH_AI_PORT || 8788);
  const limit = Number(process.env.AINSWORTH_AI_DAILY_LIMIT || 20);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw Error("Daily limit must be 1–100.");
  const origins = process.env.AINSWORTH_AI_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const { server } = await createAiServer({
    key: process.env.AINSWORTH_AI_KEY || process.env.OPENAI_API_KEY,
    accessCode: process.env.AINSWORTH_AI_ACCESS_CODE,
    directory: process.env.AINSWORTH_AI_DIRECTORY || ".ainsworth-ai",
    origins,
    dailyLimit: limit,
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `AI gateway listening on loopback port ${port}. No deployment performed.`,
    ),
  );
}
