import type { RoomId } from "./store";
export const hotspots: Record<
  RoomId,
  { x: number; y: number; label: string; kind: string }[]
> = {
  hall: [
    { x: 49, y: 54, label: "응접실로 들어가기", kind: "drawing" },
    { x: 19, y: 62, label: "저택 지도 펼치기", kind: "map" },
    { x: 80, y: 54, label: "촛불 켜고 끄기", kind: "candle" },
    { x: 87, y: 29, label: "창밖 바라보기", kind: "window" },
  ],
  drawing: [
    { x: 49, y: 56, label: "벽난로 살펴보기", kind: "fire" },
    { x: 73, y: 76, label: "Miso와 교감하기", kind: "pet" },
    { x: 23, y: 73, label: "일기장 펼치기", kind: "diary" },
    { x: 15, y: 33, label: "창밖 바라보기", kind: "window" },
    { x: 83, y: 60, label: "편지 읽기", kind: "post" },
  ],
  owlery: [
    { x: 50, y: 70, label: "Owl Post 열기", kind: "post" },
    { x: 23, y: 41, label: "우편부 부엉이", kind: "owl" },
    { x: 82, y: 45, label: "인물 수첩", kind: "profiles" },
  ],
  bedroom: [
    { x: 66, y: 72, label: "비밀 다이어리", kind: "diary" },
    { x: 28, y: 61, label: "추억함 열기", kind: "keepsakes" },
    { x: 80, y: 80, label: "Miso와 교감하기", kind: "pet" },
  ],
  library: [
    { x: 25, y: 48, label: "세계관 기록", kind: "lore" },
    { x: 72, y: 71, label: "보관한 단서", kind: "clues" },
    { x: 49, y: 35, label: "초상화의 비밀", kind: "portrait" },
  ],
  conservatory: [
    { x: 32, y: 64, label: "마법 식물 돌보기", kind: "plant" },
    { x: 71, y: 67, label: "잎사귀 관찰하기", kind: "fern" },
  ],
  mystery: [
    { x: 50, y: 45, label: "사건 수사 시작", kind: "case" },
    { x: 76, y: 76, label: "진술 기록 보기", kind: "case" },
  ],
  atelier: [
    { x: 37, y: 61, label: "필기와 커시브 연습", kind: "practice" },
    { x: 73, y: 66, label: "픽셀 아트 그리기", kind: "pixel" },
  ],
  attic: [
    { x: 35, y: 72, label: "수집품 상자", kind: "collection" },
    { x: 72, y: 50, label: "오래된 액자 살펴보기", kind: "portrait" },
  ],
};
const books = Array.from({ length: 19 }, (_, i) => ({
  x: 75 + i * 14,
  h: 42 + ((i * 13) % 30),
  c: ["#523b32", "#34483b", "#776041", "#4d3940", "#404b51"][i % 5],
}));
function Window({
  x = 160,
  y = 78,
  w = 140,
  h = 245,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${h}V65 Q${w / 2} -45 ${w} 65 V${h}Z`}
        fill="url(#sky)"
        stroke="#5c4c37"
        strokeWidth="15"
      />
      <path
        d={`M${w / 2} 5V${h}M0 ${h * 0.47}H${w}M0 ${h * 0.74}H${w}`}
        stroke="#574d3b"
        strokeWidth="6"
      />
      <path
        d={`M0 ${h}Q15 140 0 40Q45 10 45 20L25 ${h}M${w} ${h}Q${w - 15} 140 ${w} 40Q${w - 45} 10 ${w - 45} 20L${w - 25} ${h}`}
        fill="#4e4141"
        opacity=".75"
      />
      <path d={`M-15 ${h + 10}H${w + 15}`} stroke="#796449" strokeWidth="12" />
    </g>
  );
}
function Candle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx="23" ry="4" fill="#a18a52" />
      <path d="M0 0V-27M-12 0H12" stroke="#b79b60" strokeWidth="5" />
      <path d="M-5-27V-53H5V-27" fill="#d5be89" />
      <path className="flame" d="M0-55Q-13-63 0-78Q10-65 0-55" fill="#f8d18a" />
      <circle className="glow" cy="-64" r="35" fill="url(#glow)" />
    </g>
  );
}
function Shelf({ x = 60, y = 140 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width="300"
        height="265"
        rx="3"
        fill="#211c19"
        stroke="#66503a"
        strokeWidth="12"
      />
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(-60 ${row * 77 + 12})`}>
          {books.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={70 - b.h} width="11" height={b.h} fill={b.c} />
              <path
                d={`M${b.x + 2} ${76 - b.h}h7m-7 4h7`}
                stroke="#ac8b54"
                opacity=".65"
              />
            </g>
          ))}
          <path d="M62 78H357" stroke="#695037" strokeWidth="8" />
        </g>
      ))}
    </g>
  );
}
function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-24 0L-16 48H18L27 0Z" fill="#785043" />
      <ellipse rx="27" ry="8" fill="#a47559" />
      <path
        d="M0 0Q-25-35 0-93M0 0Q35-34 10-80M0-15Q-43-28-44-62M0-35Q52-49 49-75"
        fill="none"
        stroke="#546448"
        strokeWidth="4"
      />
      {[
        [-10, -65, -40],
        [-21, -38, -60],
        [22, -46, 50],
        [35, -62, 70],
        [0, -91, 10],
      ].map(([a, b, c], i) => (
        <ellipse
          key={i}
          cx={a}
          cy={b}
          rx="12"
          ry="25"
          fill={i % 2 ? "#4a6043" : "#66744e"}
          transform={`rotate(${c} ${a} ${b})`}
        />
      ))}
    </g>
  );
}
export function PetArt({ owl = false }: { owl?: boolean }) {
  return (
    <svg viewBox="0 0 150 130" aria-hidden="true" className="pet-art">
      <ellipse cx="75" cy="116" rx="49" ry="7" fill="#000" opacity=".15" />
      {owl ? (
        <g fill="#ad9d80" stroke="#514333" strokeWidth="3">
          <ellipse cx="75" cy="72" rx="39" ry="43" />
          <path d="M39 51L36 15L67 32M83 32L113 15L110 53" />
          <circle cx="59" cy="58" r="19" fill="#e4d8bb" />
          <circle cx="91" cy="58" r="19" fill="#e4d8bb" />
          <circle cx="59" cy="58" r="6" fill="#252a24" />
          <circle cx="91" cy="58" r="6" fill="#252a24" />
          <path d="M70 72L75 81L81 72" fill="#c7a25b" />
        </g>
      ) : (
        <g fill="#b29a79" stroke="#63523d" strokeWidth="2">
          <path
            d="M99 105Q143 108 129 72Q118 57 115 75Q127 100 96 92"
            fill="none"
            stroke="#a38c6c"
            strokeWidth="14"
          />
          <ellipse cx="72" cy="87" rx="32" ry="29" />
          <path d="M42 62L38 22L63 40Q77 35 88 42L108 22L105 66Q77 92 42 62Z" />
          <path d="M45 45L44 32L55 44M92 45L102 33L101 49" fill="#a87470" />
          <path
            d="M52 60Q57 66 62 60M84 60Q89 66 94 60"
            fill="none"
            stroke="#2e342c"
            strokeWidth="3"
          />
          <path d="M71 68L77 73L82 68" fill="#76514c" />
          <path d="M40 72L21 68M42 77L21 80M101 72L122 68M100 77L122 81" />
          <path d="M57 110V96M81 111V98" />
        </g>
      )}
    </svg>
  );
}
export default function Scene({
  room,
  fire,
  lights,
  petLook,
}: {
  room: RoomId;
  fire: boolean;
  lights: boolean;
  petLook: string;
}) {
  const study = ["library", "owlery", "mystery", "atelier"].includes(room);
  return (
    <svg
      className={`room-art ${room}`}
      viewBox="0 0 1100 650"
      preserveAspectRatio="none"
      aria-label={`${room} 저택 실내 일러스트`}
      role="img"
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor={room === "bedroom" ? "#5b4145" : "#414b3e"} />
          <stop offset="1" stopColor="#292c26" />
        </linearGradient>
        <linearGradient id="floor" x2="0" y2="1">
          <stop stopColor="#705039" />
          <stop offset="1" stopColor="#30251f" />
        </linearGradient>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#708285" />
          <stop offset="1" stopColor="#bdc0aa" />
        </linearGradient>
        <radialGradient id="glow">
          <stop stopColor="#f4b75b" stopOpacity=".5" />
          <stop offset="1" stopColor="#f4b75b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette">
          <stop offset=".3" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#100e0b" stopOpacity=".65" />
        </radialGradient>
        <pattern
          id="wallpaper"
          width="44"
          height="55"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M22 8q-16 15 0 32q16-17 0-32zm0 9v15m-7-8h14"
            fill="none"
            stroke="#a9976b"
            strokeOpacity=".12"
          />
        </pattern>
        <pattern id="rug" width="35" height="35" patternUnits="userSpaceOnUse">
          <path
            d="M17 2L32 17L17 32L2 17Z"
            fill="none"
            stroke="#b19762"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="1100" height="650" fill="url(#wall)" />
      <rect width="1100" height="420" fill="url(#wallpaper)" />
      <path d="M0 425H1100V650H0Z" fill="url(#floor)" />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          d={`M${i * 100} 425L${550 + (i * 100 - 550) * 2.3} 650M0 ${450 + i * 32}H1100`}
          stroke="#201a15"
          opacity=".4"
        />
      ))}
      <path
        d="M0 20H1100M0 34H1100M0 418H1100"
        stroke="#807055"
        strokeWidth="6"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect
            x={i * 100 + 10}
            y="327"
            width="80"
            height="78"
            fill="#2e2a24"
            stroke="#5e513d"
            strokeWidth="3"
          />
        </g>
      ))}
      <path
        d="M185 495L880 495L1010 626L75 626Z"
        fill="#583936"
        stroke="#ad8f5a"
        strokeWidth="5"
      />
      <path
        d="M205 510L860 510L958 610L126 610Z"
        fill="url(#rug)"
        stroke="#947747"
        strokeWidth="2"
      />
      {room === "hall" ? (
        <>
          <Window x={830} w={135} />
          <path
            d="M410 420V143Q550-28 690 143V420Z"
            fill="#211d18"
            stroke="#8b7050"
            strokeWidth="18"
          />
          <path
            d="M434 420V150Q550 12 666 150V420Z"
            fill="#44382b"
            stroke="#68523b"
            strokeWidth="5"
          />
          <path
            d="M550 67V420M447 183H651M447 320H651"
            stroke="#201e18"
            strokeWidth="5"
          />
          {[460, 570].map((x) => (
            <g key={x}>
              <rect
                x={x}
                y="193"
                width="70"
                height="112"
                fill="#302a21"
                stroke="#756044"
              />
              <rect
                x={x}
                y="335"
                width="70"
                height="64"
                fill="#302a21"
                stroke="#756044"
              />
            </g>
          ))}
          <circle cx="536" cy="270" r="5" fill="#c9a66c" />
          <circle cx="563" cy="270" r="5" fill="#c9a66c" />
          <path
            d="M100 390H300L285 465H115Z"
            fill="#49382a"
            stroke="#93714a"
            strokeWidth="5"
          />
          <path
            d="M110 465V510M280 465V510"
            stroke="#37281f"
            strokeWidth="12"
          />
          <path d="M145 386L160 353L264 365L253 390Z" fill="#c0ae86" />
          <path
            d="M176 363L177 380M195 367L196 383M218 370L217 385"
            stroke="#796b4b"
          />
          <Candle x={880} y={385} />
          <path
            d="M810 390H958M820 390V480M947 390V480"
            stroke="#55422d"
            strokeWidth="10"
          />
          <Plant x={346} y={399} s={0.9} />
        </>
      ) : null}
      {room === "drawing" ? (
        <>
          <Window x={85} />
          <Shelf x={800} y={135} />
          <rect
            x="415"
            y="231"
            width="270"
            height="225"
            fill="#3f352b"
            stroke="#8a765a"
            strokeWidth="8"
          />
          <path
            d="M445 444V302Q550 246 654 302V444Z"
            fill="#171b18"
            stroke="#6f5f49"
            strokeWidth="9"
          />
          <path
            d="M400 230H703M420 210H681"
            stroke="#9a8769"
            strokeWidth="18"
          />
          {fire && (
            <g className="fire">
              <ellipse cx="550" cy="419" rx="102" ry="70" fill="url(#glow)" />
              <path
                d="M480 434Q466 405 502 376Q495 415 531 362Q536 401 558 347Q585 392 610 377Q634 413 617 435Z"
                fill="#ba6941"
              />
              <path
                d="M506 434Q500 406 530 393Q531 417 558 383Q575 411 600 409L602 435Z"
                fill="#f2bc6c"
              />
              <path
                d="M477 439L619 422M490 425L610 441"
                stroke="#59402b"
                strokeWidth="10"
              />
            </g>
          )}
          <rect
            x="490"
            y="64"
            width="120"
            height="120"
            fill="#544333"
            stroke="#aa8a4e"
            strokeWidth="9"
          />
          <ellipse cx="550" cy="124" rx="41" ry="49" fill="#273a30" />
          <path
            d="M528 146Q550 115 572 146M538 109Q550 87 563 110V126H538Z"
            fill="#998669"
          />
          <Candle x={450} y={207} />
          <Candle x={650} y={207} />
          <path
            d="M135 447Q128 395 177 387H343Q380 392 375 451L367 526H150Z"
            fill="#526052"
            stroke="#222b24"
            strokeWidth="7"
          />
          <path d="M150 452H366M250 392V451" stroke="#859078" opacity=".5" />
          <path
            d="M136 444Q106 427 113 469V503H168V455M369 444Q400 427 393 469V503H340V455"
            fill="#414d42"
          />
          <path d="M159 523V547M358 523V547" stroke="#30251c" strokeWidth="9" />
          <ellipse
            cx="536"
            cy="535"
            rx="125"
            ry="32"
            fill="#694c32"
            stroke="#a07b4f"
            strokeWidth="5"
          />
          <path
            d="M447 539L431 594M621 539L639 594"
            stroke="#403023"
            strokeWidth="12"
          />
          <path d="M483 516L544 511L554 540L488 545Z" fill="#c8b991" />
          <ellipse cx="587" cy="520" rx="17" ry="6" fill="#ddcbaa" />
          <path d="M571 520Q570 544 586 542Q603 540 603 520" fill="#b5a17b" />
          <g transform="translate(740 455)">
            <foreignObject width="150" height="130">
              <PetArt owl={petLook === "owl"} />
            </foreignObject>
          </g>
          <path d="M878 439L947 425L956 454L891 463Z" fill="#e0cda5" />
        </>
      ) : null}
      {study ? (
        <>
          <Shelf x={50} y={130} />
          <Window x={450} y={65} w={190} h={260} />
          {room === "owlery" ? (
            <g transform="translate(190 145)">
              <foreignObject width="160" height="150">
                <PetArt owl />
              </foreignObject>
            </g>
          ) : null}
          {room === "mystery" ? (
            <g>
              <rect
                x="350"
                y="88"
                width="400"
                height="258"
                fill="#665137"
                stroke="#332a22"
                strokeWidth="13"
              />
              {[0, 1, 2, 3, 4].map((i) => (
                <g
                  key={i}
                  transform={`translate(${380 + i * 66} ${120 + (i % 2) * 90}) rotate(${i % 2 ? 8 : -7})`}
                >
                  <rect width="55" height="75" fill="#c9b68e" />
                  <path d="M8 20H45M8 30H40M8 40H46M8 50H33" stroke="#796d53" />
                </g>
              ))}
              <path
                d="M407 140L535 230L675 148L470 228"
                fill="none"
                stroke="#9b4c43"
                strokeWidth="2"
              />
            </g>
          ) : (
            <Shelf x={750} y={140} />
          )}
          <path
            d="M307 462L740 462L800 523H259Z"
            fill="#77593a"
            stroke="#a58353"
            strokeWidth="7"
          />
          <path
            d="M287 526L275 605M764 526L779 605"
            stroke="#35291f"
            strokeWidth="15"
          />
          <path d="M430 471L527 466L556 502L457 510Z" fill="#d7c39a" />
          <path
            d="M446 479L519 475M452 486L527 482M458 493L510 488"
            stroke="#8d7a59"
          />
          <Candle x={680} y={472} />
          {room === "atelier" && (
            <>
              <path
                d="M370 460L390 250L530 247L557 462"
                fill="none"
                stroke="#775b37"
                strokeWidth="9"
              />
              <rect x="390" y="267" width="141" height="153" fill="#c9b891" />
              <path
                d="M410 385Q420 290 453 322T510 307"
                fill="none"
                stroke="#55654b"
                strokeWidth="3"
              />
            </>
          )}
        </>
      ) : null}
      {room === "bedroom" ? (
        <>
          <Window x={80} w={160} />
          <path
            d="M335 169Q475 83 615 169V430H335Z"
            fill="#543f35"
            stroke="#94714e"
            strokeWidth="10"
          />
          <path d="M328 337H614L682 478H278Z" fill="#b7aa90" />
          <path d="M325 363H625L682 478H278Z" fill="#6b474e" />
          <path
            d="M340 347L350 318H457L456 348M474 348L476 318H578L600 348"
            fill="#ded0b2"
          />
          <path
            d="M283 478H678V522H283Z"
            fill="#49372a"
            stroke="#876649"
            strokeWidth="6"
          />
          <path
            d="M744 451H1010L1033 486H718ZM740 487V569M1007 487V569"
            fill="#695035"
            stroke="#9b794d"
            strokeWidth="6"
          />
          <path
            d="M765 453L838 445L851 475L775 483Z"
            fill="#31513f"
            stroke="#b59862"
            strokeWidth="2"
          />
          <Candle x={970} y={450} />
          <path
            d="M176 433H278V492H176Z"
            fill="#694630"
            stroke="#bd995d"
            strokeWidth="4"
          />
          <path d="M225 440V470" stroke="#bf9c56" strokeWidth="9" />
          <g transform="translate(850 480)">
            <foreignObject width="150" height="130">
              <PetArt owl={petLook === "owl"} />
            </foreignObject>
          </g>
        </>
      ) : null}
      {room === "conservatory" ? (
        <>
          <path
            d="M80 420V100Q550-80 1020 100V420Z"
            fill="url(#sky)"
            opacity=".7"
          />
          {[100, 250, 400, 550, 700, 850, 1000].map((x) => (
            <path
              key={x}
              d={`M${x} 420V100M80 ${x / 3 + 40}H1020`}
              stroke="#424c3e"
              strokeWidth="9"
            />
          ))}
          <path
            d="M100 450H460M120 450V520M440 450V520M620 459H1000M640 459V530M980 459V530"
            stroke="#725a3a"
            strokeWidth="15"
          />
          {[180, 285, 395, 710, 850, 960].map((x, i) => (
            <Plant key={x} x={x} y={i < 3 ? 402 : 412} s={1 + (i % 3) * 0.3} />
          ))}
          <Plant x={550} y={493} s={1.8} />
        </>
      ) : null}
      {room === "attic" ? (
        <>
          <path
            d="M0 0L550 100L1100 0M0 40L550 140L1100 40M550 0V420M0 340L550 50L1100 340"
            fill="none"
            stroke="#36271c"
            strokeWidth="23"
          />
          <Window x={460} y={135} w={170} h={170} />
          <path
            d="M180 449Q280 360 400 449V550H180Z"
            fill="#6b4930"
            stroke="#b08a4f"
            strokeWidth="7"
          />
          <path
            d="M180 456H400M230 424V550M350 422V550"
            stroke="#3d3022"
            strokeWidth="12"
          />
          <rect x="275" y="451" width="29" height="34" fill="#b49456" />
          <rect
            x="744"
            y="260"
            width="160"
            height="205"
            fill="#3b4435"
            stroke="#b59559"
            strokeWidth="12"
          />
          <path
            d="M774 432Q813 285 870 427"
            fill="none"
            stroke="#a48a65"
            strokeWidth="3"
          />
          <Plant x={960} y={453} />
        </>
      ) : null}
      {!lights && (
        <rect width="1100" height="650" fill="#101620" opacity=".4" />
      )}
      <rect width="1100" height="650" fill="url(#vignette)" />
      <g fill="#e7c58b" opacity=".45" className="dust">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle
            key={i}
            cx={130 + i * 130}
            cy={100 + ((i * 79) % 280)}
            r={i % 2 ? 1 : 1.6}
          />
        ))}
      </g>
    </svg>
  );
}
