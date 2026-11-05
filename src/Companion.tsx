import { useEffect, useState } from "react";
import { PetArt } from "./Scene";
import { today } from "./store";
import type { ModuleProps } from "./Post";
export function Companion({ state, update, notify }: ModuleProps) {
  const [reaction, setReaction] = useState(""),
    [anim, setAnim] = useState(""),
    [name, setName] = useState(state.pet.name);
  useEffect(() => {
    if (!anim) return;
    const t = setTimeout(() => setAnim(""), 2600);
    return () => clearTimeout(t);
  }, [anim]);
  const night =
    state.time === "night" ||
    (state.time === "auto" &&
      (new Date().getHours() < 7 || new Date().getHours() > 20));
  function act(action: string) {
    let gain = 1;
    let text = "";
    if (action === "feed") {
      gain = state.pet.fed === today() ? 0 : 4;
      text = gain
        ? "작은 간식을 오물오물 먹고 당신을 올려다봅니다."
        : "오늘은 충분히 먹었어요. 곁에 앉아 주는 것만으로도 좋아해요.";
    }
    if (action === "pet")
      text = [
        "손에 머리를 기대며 나지막이 소리를 냅니다.",
        "살짝 눈을 감고 손바닥에 이마를 비벼요.",
        "천천히 눈을 깜빡이며 작은 인사를 건네요.",
      ][Math.floor(Math.random() * 3)];
    if (action === "play")
      text = "깃털 장난감을 따라 폴짝! 한 바퀴를 돌아옵니다.";
    if (action === "sleep") text = "당신 곁에서 몸을 둥글게 말고 잠이 듭니다.";
    update((s) => ({
      ...s,
      pet: {
        ...s.pet,
        bond: Math.min(100, s.pet.bond + gain),
        action:
          action === "sleep"
            ? "sleeping"
            : action === "play"
              ? "walking"
              : "happy",
        fed: action === "feed" ? today() : s.pet.fed,
      },
    }));
    setReaction(text);
    setAnim(action);
  }
  return (
    <div className="companion">
      <p className="eyebrow">A LITTLE SOUL, A LITTLE MAGIC</p>
      <div
        className={`companion-portrait action-${anim || state.pet.action} ${night ? "sleepy" : ""}`}
      >
        <span className="pet-stars">✧　 ·　 ✦</span>
        <PetArt
          owl={state.pet.look === "owl"}
          pose={
            state.pet.action === "sleeping"
              ? 2
              : state.pet.action === "walking"
                ? 3
                : state.pet.action === "happy"
                  ? 1
                  : 0
          }
        />
        {state.pet.action === "sleeping" && <span className="zzz">z z Z</span>}
      </div>
      <h3>{state.pet.name}</h3>
      <p className="pet-reaction" role="status">
        {reaction ||
          (night
            ? "밤이 깊었네요. 졸린 눈으로 당신 곁에 머뭅니다."
            : "문이 열리자 반가운 눈으로 당신을 바라봅니다.")}
      </p>
      <div className="bond">
        <span>함께 쌓은 친밀도</span>
        <progress max="100" value={state.pet.bond} />
        <span>{state.pet.bond} / 100</span>
      </div>
      <div className="pet-actions">
        <button onClick={() => act("pet")}>쓰다듬기</button>
        <button onClick={() => act("feed")}>먹이 주기</button>
        <button onClick={() => act("play")}>장난감으로 놀기</button>
        <button onClick={() => act("sleep")}>쉬게 해 주기</button>
      </div>
      <div className="pet-settings">
        <label>
          이름
          <input
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            if (name.trim()) {
              update((s) => ({ ...s, pet: { ...s.pet, name: name.trim() } }));
              notify("새 이름을 기억할게요.");
            }
          }}
        >
          이름 저장
        </button>
        <label>
          모습
          <select
            value={state.pet.look}
            onChange={(e) =>
              update((s) => ({ ...s, pet: { ...s.pet, look: e.target.value } }))
            }
          >
            <option value="cat">작은 마법 고양이</option>
            <option value="owl">작은 부엉이</option>
          </select>
        </label>
      </div>
      <p className="muted">
        하루를 건너뛰어도 친밀도가 줄어들지 않아요. 먹이는 하루 한 번 친밀도를
        높입니다.
      </p>
    </div>
  );
}
