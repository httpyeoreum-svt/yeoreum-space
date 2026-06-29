import type { StaticImageData } from "next/image";
import type { CharId } from "@/lib/night-train";
import scoups from "./scoups.jpg";
import jeonghan from "./jeonghan.jpg";
import joshua from "./joshua.jpg";
import jun from "./jun.jpg";
import hoshi from "./hoshi.jpg";
import wonwoo from "./wonwoo.png";
import woozi from "./woozi.jpg";
import minghao from "./minghao.jpg";
import mingyu from "./mingyu.jpg";
import dk from "./dk.jpg";
import seungkwan from "./seungkwan.jpg";
import vernon from "./vernon.jpg";
import dino from "./dino.jpg";

// キャラクターのアイコン画像。<charId>.(jpg|png) を置いて import 登録。
// 未登録の人物はイニシャル円で表示。

export const AVATARS: Partial<Record<CharId, StaticImageData>> = {
  scoups,
  jeonghan,
  joshua,
  jun,
  hoshi,
  wonwoo,
  woozi,
  minghao,
  mingyu,
  dk,
  seungkwan,
  vernon,
  dino,
};
