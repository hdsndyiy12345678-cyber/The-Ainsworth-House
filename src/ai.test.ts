import { describe, it, expect } from "vitest";
import { applyServerJob, endpoint } from "./ai";
import { initialState, validateBackup, type MailJob } from "./store";
const id = "12345678-1234-1234-1234-123456789abc";
const job: MailJob = {
  id,
  letterId: "sent",
  endpoint: "",
  phase: "generating",
  submitted: true,
  createdAt: new Date().toISOString(),
  request: {
    id,
    date: "1994-10-08",
    person: {
      id: "hermione",
      name: "Hermione",
      relation: "Friend",
      year: "1994",
      notes: "",
    },
    letters: [{ subject: "Dear friend", body: "Hello", direction: "outgoing" }],
  },
};
describe("AI mail records", () => {
  it("imports old backups and round trips queued records without credentials", () => {
    const state = initialState();
    expect(validateBackup(state)).toEqual(state);
    state.mailJobs = [job];
    expect(validateBackup(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(JSON.stringify(state)).not.toContain("apiKey");
  });
  it("receives exactly one unread AI reply while keeping originals unchanged", () => {
    const state = { ...initialState(), mailJobs: [job] };
    const response = {
      id,
      status: "delivered" as const,
      result: { subject: "Reply", body: "Dear Elena" },
    };
    const result = applyServerJob(state, id, response);
    expect(result.letters).toHaveLength(2);
    expect(result.letters[0]).toEqual(state.letters[0]);
    expect(result.letters[1]).toMatchObject({
      source: "ai",
      sample: false,
      read: false,
      folder: "inbox",
      replyTo: "sent",
    });
    expect(applyServerJob(result, id, response).letters).toHaveLength(2);
  });
  it("rejects corrupt phases, destinations and duplicate job IDs", () => {
    for (const changed of [
      { ...job, phase: "paid" },
      { ...job, endpoint: "https://user:password@host.example" },
      { ...job, endpoint: "http://host.example" },
      { ...job, request: {} },
    ])
      expect(() =>
        validateBackup({ ...initialState(), mailJobs: [changed] }),
      ).toThrow();
    expect(() =>
      validateBackup({ ...initialState(), mailJobs: [job, job] }),
    ).toThrow();
  });
  it("accepts HTTPS and loopback endpoints only", () => {
    expect(endpoint("http://127.0.0.1:8788/")).toBe("http://127.0.0.1:8788");
    for (const value of [
      "http://public.example",
      "https://host.example?key=private",
      "https://user:key@host.example",
      "javascript:alert(1)",
    ])
      expect(() => endpoint(value)).toThrow();
  });
});
