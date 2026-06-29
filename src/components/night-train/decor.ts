// 目的（▸）マーカーのアニメGIF。
// 画像を src/components/night-train/ に置き、ここで import して .src を渡す。
// 未設定（null）のあいだは、テキストの「▸」が表示される。

import arrow from "./objective-arrow.gif";
import mapIcon from "./map-icon.gif";

export const OBJECTIVE_ARROW: string | null = arrow.src;

// 車内マップの各部屋の行頭アイコン。
export const MAP_ICON: string | null = mapIcon.src;

// 「進行中」バッジのアイコンに使うアニメGIF。未設定（null）なら吹き出しアイコン。
import progress from "./progress.gif";
export const PROGRESS_ICON: string | null = progress.src;
