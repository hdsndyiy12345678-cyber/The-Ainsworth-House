import { createContext } from "react";
import type { RoomId } from "./store";
export const HouseNavigation = createContext<{
  openMap: () => void;
  go: (room: RoomId) => void;
  room: RoomId;
} | null>(null);
