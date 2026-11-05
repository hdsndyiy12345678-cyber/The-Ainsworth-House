import { describe, it, expect } from "vitest";
import { initialState, validateBackup } from "./store";
import { CASE, judgeDeduction } from "./case";
describe("backup validation", () => {
  it("round trips complete records including attachments, ink and optional atelier", () => {
    const s = initialState();
    s.entries = [
      {
        id: "e",
        date: "1994-10-08",
        title: "a",
        body: "b",
        mood: "quiet",
        weather: "rain",
        paper: "cream",
        sticker: "❦",
        bookmark: true,
        deleted: false,
        strokes: [
          {
            color: "#123456",
            width: 3,
            erase: false,
            points: [{ x: 10, y: 12, p: 0.4 }],
          },
        ],
      },
    ];
    s.atelier = { strokes: [], pixels: Array(256).fill("") };
    expect(validateBackup(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it.each([
    { version: 2 },
    { ...initialState(), letters: [{}] },
    { ...initialState(), pet: { name: "Miso", bond: "bad" } },
    { ...initialState(), entries: [{ id: "e", strokes: "bad" }] },
    { ...initialState(), mystery: { ...initialState().mystery, links: "bad" } },
    { ...initialState(), atelier: { strokes: [], pixels: [] } },
  ])("rejects unsupported or corrupt structures", (value) =>
    expect(() => validateBackup(value)).toThrow(),
  );
  it("rejects duplicate IDs", () => {
    const s = initialState();
    s.letters.push({ ...s.letters[0] });
    expect(() => validateBackup(s)).toThrow(/중복/);
  });
});
describe("canonical case", () => {
  it("requires specific evidence and a reason", () => {
    expect(judgeDeduction("theo", [], "the key")).toMatchObject({
      solved: false,
    });
    expect(judgeDeduction("theo", ["key", "dust", "seal"], "")).toMatchObject({
      solved: false,
    });
  });
  it("keeps facts fixed across failed hypotheses and a successful resolution", () => {
    const before = JSON.stringify(CASE);
    expect(
      judgeDeduction(
        "mara",
        ["key", "dust", "seal"],
        "열쇠를 빌려 전시함을 열었다",
      ),
    ).toMatchObject({ solved: false });
    expect(
      judgeDeduction(
        "theo",
        ["key", "dust", "seal"],
        "열쇠를 빌려 월장석으로 망원경 실험을 했다",
      ),
    ).toMatchObject({ solved: true });
    expect(JSON.stringify(CASE)).toBe(before);
    expect(Object.isFrozen(CASE.truth)).toBe(true);
  });
});

describe("additional studio records remain backwards-compatible", () => {
  it("round trips separate practice pages and pixel sketchbooks", () => {
    const s = initialState();
    s.atelier = {
      strokes: [],
      pixels: Array(256).fill(""),
      practicePages: {
        "letters:0": [
          {
            color: "#536747",
            width: 3,
            erase: false,
            points: [{ x: 20, y: 30, p: 0.7 }],
          },
        ],
      },
      pixelWorks: [
        { id: "one", name: "My teacup", pixels: Array(256).fill("#536747") },
      ],
    };
    expect(validateBackup(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("rejects malformed practice strokes", () => {
    const s = initialState() as any;
    s.atelier = {
      strokes: [],
      pixels: Array(256).fill(""),
      practicePages: {
        bad: [
          {
            color: "#123456",
            width: 3,
            erase: false,
            points: [{ x: "bad", y: 0, p: 1 }],
          },
        ],
      },
    };
    expect(() => validateBackup(s)).toThrow();
  });
  it("rejects malformed pixel sketchbooks", () => {
    const s = initialState() as any;
    s.atelier = {
      strokes: [],
      pixels: Array(256).fill(""),
      pixelWorks: [{ id: "one", name: "bad", pixels: [] }],
    };
    expect(() => validateBackup(s)).toThrow();
  });
});
