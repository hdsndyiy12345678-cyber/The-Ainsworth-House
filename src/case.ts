// Canonical case facts never live in the player's editable save or imported backups.
export const CASE = Object.freeze({
  id: "missing-moonstone",
  name: "The Missing Moonstone",
  date: "8 October 1994",
  location: "Hogwarts · West Library",
  summary:
    "서쪽 도서관의 작은 전시함에서 월장석이 사라졌다. 전시함은 잠겨 있었고 창문은 안쪽에서 봉인된 채였다. 오후 6시부터 6시 20분 사이, 세 학생이 이곳을 지나갔다. 누가, 어떻게, 왜 가져갔을까?",
  truth: Object.freeze({
    culprit: "theo",
    time: "18:10",
    action:
      "Theo borrowed the cabinet key, removed the moonstone, and carried it to the east tower for an unauthorised telescope experiment.",
    method: "빌린 전시함 열쇠로 문을 열었다.",
    motive: "동쪽 탑에서 월장석 렌즈로 별빛 관측 실험을 하려고 했다.",
  }),
  evidence: Object.freeze([
    {
      id: "seal",
      name: "온전한 창문 봉인",
      place: "서쪽 창문",
      description:
        "전날 찍은 보랏빛 밀랍 봉인이 끊어지지 않았다. 창문을 통해 들어온 흔적은 없다.",
      time: "17:50",
      reliability: "확정 물증",
    },
    {
      id: "key",
      name: "열쇠 대출 장부",
      place: "사서의 책상",
      description:
        "18:05 — Theo Finch. 사유: 전시함 아래 칸의 성도집 열람. 18:16 반납. 이 시간대의 유일한 열쇠 대출자다.",
      time: "18:05–18:16",
      reliability: "확정 문서",
    },
    {
      id: "dust",
      name: "은빛 월장석 가루",
      place: "동쪽 탑 난간",
      description:
        "전시함 안감과 동일한 은빛 가루가 망원경 받침과 Theo의 짙은 회색 소매에서 발견됐다. 새 망원경에는 둥근 렌즈 자리가 비어 있다.",
      time: "18:15",
      reliability: "확정 물증",
    },
    {
      id: "receipt",
      name: "주방의 서명된 영수증",
      place: "주방 문 옆",
      description:
        "Owen이 18:02부터 18:18까지 주방에서 빵을 굽는 것을 관리인이 확인했다. 18:12에 두 사람 모두 서명했다.",
      time: "18:02–18:18",
      reliability: "문서 + 독립 증언",
    },
    {
      id: "greenhouse",
      name: "온실 관찰 기록",
      place: "온실 출입대장",
      description:
        "Mara는 17:58에 온실에 들어와 18:25에 나왔다. 담당 교수와 함께 움직이는 덩굴을 관찰했다. 출입문은 하나뿐이다.",
      time: "17:58–18:25",
      reliability: "문서 + 독립 증언",
    },
  ]),
  suspects: Object.freeze([
    {
      id: "theo",
      name: "Theo Finch",
      house: "Ravenclaw · 4th year",
      note: "별과 오래된 광학 기구에 관심이 많다.",
      statement:
        "6시 무렵엔 동쪽 탑으로 가는 계단에 있었어. 전시함 근처에는 가지 않았지.",
      reliability: "검증 전 진술",
      actual: "18:05 열쇠 대출 → 18:10 전시함 → 18:15 동쪽 탑",
      alibi: "열쇠 장부가 전시함에 가지 않았다는 진술과 모순됩니다.",
    },
    {
      id: "mara",
      name: "Mara Bell",
      house: "Hufflepuff · 4th year",
      note: "약초학 관찰 일지를 꼼꼼히 작성한다.",
      statement:
        "온실에 있었어. 교수님과 덩굴이 움직이는 시간을 재고 있었거든. 6시 25분까지.",
      reliability: "독립 증언으로 확인 가능",
      actual: "17:58–18:25 온실",
      alibi: "온실 출입대장과 담당 교수의 증언이 일치합니다.",
    },
    {
      id: "owen",
      name: "Owen Reed",
      house: "Gryffindor · 4th year",
      note: "주방에서 새로운 빵 조리법을 배우고 있다.",
      statement:
        "주방에서 빵을 굽고 있었어. 관리인에게 부탁한 재료를 받으며 6시 12분에 서명했어.",
      reliability: "서명 문서로 확인 가능",
      actual: "18:02–18:18 주방",
      alibi: "관리인의 확인과 18:12 영수증이 일치합니다.",
    },
  ]),
  timeline: Object.freeze([
    { time: "17:50", text: "사서가 월장석과 전시함 잠금을 확인했다." },
    { time: "18:00", text: "도서관 서쪽 통로의 정규 점검이 끝났다." },
    { time: "18:20", text: "사서가 빈 전시함을 발견했다." },
  ]),
});
export function judgeDeduction(
  suspect: string,
  evidence: string[],
  reason: string,
) {
  if (
    evidence.length < 3 ||
    !evidence.includes("key") ||
    !evidence.includes("dust")
  )
    return {
      solved: false,
      message:
        "수사 기록이 더 필요합니다. 열쇠의 이동과 월장석의 흔적을 찾아 최소 세 가지 물증을 모아 주세요.",
    };
  if (reason.trim().length < 10)
    return {
      solved: false,
      message: "수단과 동기를 연결해 10자 이상으로 추론을 적어 주세요.",
    };
  if (suspect !== CASE.truth.culprit)
    return {
      solved: false,
      message:
        "이 사람의 확인된 알리바이와 물증을 다시 비교해 보세요. 확정 사실은 바뀌지 않습니다.",
    };
  return {
    solved: true,
    message: `Theo가 자백했다. ${CASE.truth.method} ${CASE.truth.motive} 월장석은 망원경 상자에서 무사히 회수되었다.`,
  };
}
