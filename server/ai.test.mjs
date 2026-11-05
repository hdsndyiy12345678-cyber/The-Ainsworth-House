import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import {
  createQueue,
  openAIReply,
  validateRequest,
  ApiError,
  MAX_TOKENS,
} from "./ai-core.mjs";
import { createAiServer } from "./ai-server.mjs";
const request = () => ({
  id: randomUUID(),
  date: "1994-10-08",
  person: {
    id: "hermione",
    name: "Hermione",
    year: "1994",
    relation: "Friend",
    notes: "Careful and warm",
  },
  letters: [
    {
      subject: "A quiet day",
      body: "Dear Hermione, how is your garden?",
      direction: "outgoing",
    },
  ],
});
async function directory(t) {
  const dir = await mkdtemp(join(tmpdir(), "ainsworth-ai-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test("OpenAI transport uses the fixed model, schema, output bound and selected context only", async () => {
  const input = {
    ...request(),
    diary: "PRIVATE_DIARY",
    image: "PRIVATE_IMAGE",
    mystery: "PRIVATE_TRUTH",
  };
  let call;
  const result = await openAIReply(validateRequest(input), {
    key: "test-key",
    fetcher: async (url, options) => {
      call = { url, options };
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                subject: "From the garden",
                body: "Dear Elena, thank you for your lovely letter. Yours, Hermione",
              }),
            },
          },
        ],
      });
    },
  });
  assert.equal(result.subject, "From the garden");
  assert.equal(call.url, "https://api.openai.com/v1/chat/completions");
  const body = JSON.parse(call.options.body);
  assert.equal(body.max_completion_tokens, MAX_TOKENS);
  assert.equal(body.store, false);
  assert.equal(body.response_format.json_schema.strict, true);
  assert.ok(!call.options.body.includes("PRIVATE_"));
});
test("provider refuses, truncates, malforms and rate limits without leaking its body", async () => {
  for (const data of [
    { choices: [{ finish_reason: "length" }] },
    { choices: [{ finish_reason: "stop", message: { content: "invalid" } }] },
    {
      choices: [
        { finish_reason: "stop", message: { refusal: "no", content: "{}" } },
      ],
    },
  ])
    await assert.rejects(
      openAIReply(request(), {
        key: "test",
        fetcher: async () => Response.json(data),
      }),
      /답장/,
    );
  await assert.rejects(
    openAIReply(request(), {
      key: "test",
      fetcher: async () => new Response("PRIVATE_SECRET", { status: 429 }),
    }),
    (e) => e.status === 429 && !e.message.includes("PRIVATE_SECRET"),
  );
});
test("reject oversized, missing and non-letter requests before provider access", () => {
  for (const change of [
    { id: "bad" },
    { letters: [] },
    {
      letters: [
        { subject: "X", body: "x".repeat(8001), direction: "outgoing" },
      ],
    },
    { person: {} },
  ])
    assert.throws(() => validateRequest({ ...request(), ...change }), ApiError);
});
test("durable queue is idempotent across concurrency and restart; quota survives failures", async (t) => {
  const dir = await directory(t);
  let calls = 0;
  let queue = await createQueue({
    directory: dir,
    dailyLimit: 2,
    generate: async () => {
      calls++;
      return { subject: "Reply", body: "Dear Elena" };
    },
  });
  const first = request();
  await Promise.all([
    queue.submit(first),
    queue.submit(first),
    queue.submit(first),
  ]);
  await queue.idle();
  assert.equal(calls, 1);
  assert.equal((await queue.get(first.id)).status, "delivered");
  await assert.rejects(
    queue.submit({ ...first, date: "1994-10-09" }),
    (e) => e.status === 409,
  );
  queue = await createQueue({
    directory: dir,
    dailyLimit: 2,
    generate: async () => {
      calls++;
      throw new ApiError(502, "Provider failed");
    },
  });
  await queue.submit(first);
  await queue.idle();
  assert.equal(calls, 1);
  const second = request();
  await queue.submit(second);
  await queue.idle();
  assert.equal((await queue.get(second.id)).status, "failed");
  assert.deepEqual(queue.usage(), { used: 2, limit: 2 });
  await assert.rejects(queue.submit(request()), (e) => e.status === 429);
  const stored = JSON.parse(await readFile(join(dir, "queue.json"), "utf8"));
  assert.equal(stored.jobs[first.id].payload, undefined);
  assert.equal((await stat(join(dir, "queue.json"))).mode & 0o777, 0o600);
});
test("restart interrupts uncertain work without automatically billing again; retention expires results", async (t) => {
  const dir = await directory(t);
  const p = request();
  let calls = 0,
    now = Date.now();
  await writeFile(
    join(dir, "queue.json"),
    JSON.stringify({
      jobs: {
        [p.id]: { id: p.id, status: "generating", payload: p, created: now },
      },
      usage: { [new Date(now).toISOString().slice(0, 10)]: 1 },
    }),
  );
  const queue = await createQueue({
    directory: dir,
    now: () => now,
    generate: async () => {
      calls++;
    },
  });
  assert.equal((await queue.get(p.id)).status, "failed");
  assert.equal(calls, 0);
  assert.equal(queue.usage().used, 1);
  now += 86400001;
  await assert.rejects(queue.get(p.id), (e) => e.status === 404);
});
test("corrupt ledger never resets the spending limit", async (t) => {
  const dir = await directory(t);
  await writeFile(join(dir, "queue.json"), "broken");
  await assert.rejects(
    createQueue({ directory: dir, generate: async () => {} }),
    /refusing to reset/,
  );
});
test("HTTP API checks origin, access code, setup, body and serves completed jobs", async (t) => {
  const dir = await directory(t);
  let calls = 0;
  const { server, queue } = await createAiServer({
    directory: dir,
    key: "test-provider-key",
    accessCode: "test-access-code",
    generate: async () => {
      calls++;
      return { subject: "Reply", body: "Dear Elena" };
    },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}/api/ai/`;
  const headers = {
    "Content-Type": "application/json",
    "X-Ainsworth-Code": "test-access-code",
    Origin: "http://127.0.0.1:5173",
  };
  assert.equal(
    (
      await fetch(base + "jobs", {
        method: "POST",
        headers: { ...headers, Origin: "https://untrusted.example" },
        body: JSON.stringify(request()),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "jobs", {
        method: "POST",
        headers: { ...headers, "X-Ainsworth-Code": "wrong" },
        body: JSON.stringify(request()),
      })
    ).status,
    401,
  );
  assert.equal(calls, 0);
  const p = request();
  const response = await fetch(base + "jobs", {
    method: "POST",
    headers,
    body: JSON.stringify(p),
  });
  assert.equal(response.status, 202);
  await queue.idle();
  assert.equal(
    (await (await fetch(base + `jobs/${p.id}`, { headers })).json()).status,
    "delivered",
  );
  assert.equal(calls, 1);
  const status = await (await fetch(base + "status", { headers })).json();
  assert.equal(status.configured, true);
  assert.ok(!JSON.stringify(status).includes("test-provider-key"));
  assert.equal(
    (await fetch(base + "jobs", { method: "POST", headers, body: "invalid" }))
      .status,
    400,
  );
  assert.equal(
    (
      await fetch(base + "jobs", {
        method: "POST",
        headers,
        body: JSON.stringify({ huge: "x".repeat(80001) }),
      })
    ).status,
    413,
  );
});
test("unconfigured gateway cannot invoke a provider", async (t) => {
  const dir = await directory(t);
  const { server } = await createAiServer({
    directory: dir,
    generate: async () => assert.fail("must not call provider"),
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/ai/jobs`,
    { method: "POST" },
  );
  assert.equal(response.status, 503);
});

test("UTF-8 Korean letters survive chunks split inside a character", async (t) => {
  const dir = await directory(t);
  let received;
  const { server, queue } = await createAiServer({
    directory: dir,
    key: "test-key",
    accessCode: "test-code",
    generate: async (p) => {
      received = p;
      return { subject: "답장", body: "안녕, 엘레나" };
    },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  const p = request();
  p.letters[0].body = "안녕, 정원의 라벤더가 피었어.";
  const bytes = Buffer.from(JSON.stringify(p));
  const split = bytes.indexOf(Buffer.from("안녕")) + 1;
  const status = await new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: "127.0.0.1",
        port: server.address().port,
        path: "/api/ai/jobs",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ainsworth-Code": "test-code",
        },
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      },
    );
    req.on("error", reject);
    req.write(bytes.subarray(0, split));
    setTimeout(() => req.end(bytes.subarray(split)), 20);
  });
  assert.equal(status, 202);
  await queue.idle();
  assert.equal(received.letters[0].body, p.letters[0].body);
});
