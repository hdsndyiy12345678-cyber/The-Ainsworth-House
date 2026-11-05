import { Compass, MapPin, Check } from "lucide-react";
import { art } from "./assets";
import { rooms, type RoomId } from "./store";
export const mapPositions: Record<RoomId, [number, number]> = {
  attic: [50, 27],
  bedroom: [28, 43],
  mystery: [46, 43],
  atelier: [68, 43],
  owlery: [83, 43],
  conservatory: [17, 76],
  library: [33, 76],
  hall: [51, 76],
  drawing: [73, 76],
};
export function MiniMap({
  room,
  onClick,
}: {
  room: RoomId;
  onClick: () => void;
}) {
  const p = mapPositions[room];
  return (
    <button className="persistent-map" aria-label="저택 지도" onClick={onClick}>
      <span className="mini-title">
        Manor map <Compass size={19} />
      </span>
      <span className="mini-art">
        <img src={art("map.webp")} alt="" />
        <MapPin
          className="current-pin"
          size={20}
          style={{ left: `${p[0]}%`, top: `${p[1]}%` }}
        />
      </span>
    </button>
  );
}
export function ManorMap({
  room,
  visited,
  go,
}: {
  room: RoomId;
  visited: RoomId[];
  go: (r: RoomId) => void;
}) {
  return (
    <div className="expanded-map">
      <div className="map-house">
        <img src={art("map.webp")} alt="저택의 3층 구조와 아홉 개 방" />
        {rooms.map((r) => {
          const [x, y] = mapPositions[r.id];
          return (
            <button
              key={r.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`map-destination ${room === r.id ? "here" : ""}`}
              onClick={() => go(r.id)}
              aria-current={room === r.id ? "location" : undefined}
            >
              <span>{r.name}</span>
              <small>{room === r.id ? "YOU ARE HERE" : r.noun}</small>
              {visited.includes(r.id) && <Check size={13} />}
            </button>
          );
        })}
      </div>
      <p className="map-legend">
        <MapPin size={14} />
        현재 위치 · <Check size={14} />
        방문한 공간 <span>{visited.length} / 9</span>
      </p>
    </div>
  );
}
