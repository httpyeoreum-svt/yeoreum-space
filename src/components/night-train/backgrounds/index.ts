import type { StaticImageData } from "next/image";
import type { RoomId } from "@/lib/night-train";
import titleBg from "../title-bg.jpg";
import compartment from "./compartment.jpg";
import shower from "./shower.jpg";
import lounge from "./lounge.png";
import diner from "./diner.png";
import stairs from "./stairs.jpg";

// 各部屋（とタイトル/OPENING）の背景画像。
// 画像はこのフォルダに置き、ここに import して登録する。未登録の部屋は背景なし。
// id: compartment / shower / corridor / lounge / diner / stairs / engine

export const ROOM_BG: Partial<Record<RoomId, StaticImageData>> = {
  corridor: titleBg, // 廊下はタイトルと同じ画像
  compartment,
  shower,
  lounge,
  diner,
  stairs,
};
