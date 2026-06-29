// 23:30 NIGHT TRAIN MYSTERY の設計書を src/lib/night-train.ts から自動生成する。
//   実行: npm run gen:nt-doc   （出力: docs/night-train.md）
// データ（会話・条件・嘘・真相）を“唯一の正”とし、人間が読める一覧へ変換する。
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NIGHT_TRAIN,
  SECRETS,
  LIE_TYPE_LABEL,
  type CharId,
  type NTCondition,
  type NTEffect,
} from "../src/lib/night-train.ts";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../docs/night-train.md");

const chars = NIGHT_TRAIN.characters;
const charName: Record<string, string> = Object.fromEntries(
  chars.map((c) => [c.id, c.name]),
);

// 既知情報id → タイトル（会話の effect.learn から収集）。
const knownLabel: Record<string, string> = {};
for (const c of chars)
  for (const t of c.topics)
    for (const n of t.effect?.learn ?? []) knownLabel[n.id] = n.title;

// フラグid → 表示名（手動の対応表。未登録はidそのまま）。
const flagLabel: Record<string, string> = {
  "alibi-broken": "アリバイ崩壊",
  "motive-known": "動機判明",
  "asked-key": "鍵について聞いた",
  "witness-mingyu": "目撃証言を得た",
};

function cond(c?: NTCondition): string {
  if (!c) return "いつでも";
  const p: string[] = [];
  if (c.flags) p.push(...c.flags.map((f) => `「${flagLabel[f] ?? f}」`));
  if (c.notFlags) p.push(...c.notFlags.map((f) => `「${flagLabel[f] ?? f}」でない`));
  if (c.known) p.push(...c.known.map((k) => `『${knownLabel[k] ?? k}』を知っている`));
  if (c.affinityAtLeast != null) p.push(`親密度≥${c.affinityAtLeast}`);
  if (c.talkedTo) p.push(...c.talkedTo.map((t) => `${charName[t] ?? t}に話した後`));
  if (c.firstTalk) p.push(`最初に話した相手が${charName[c.firstTalk] ?? c.firstTalk}`);
  return p.length ? p.join(" かつ ") : "いつでも";
}

function effect(e?: NTEffect): string {
  if (!e) return "";
  const p: string[] = [];
  if (e.flags) p.push(`フラグ: ${e.flags.map((f) => flagLabel[f] ?? f).join(", ")}`);
  if (e.affinity) p.push(`親密度${e.affinity > 0 ? "+" : ""}${e.affinity}`);
  if (e.learn) p.push(`入手: ${e.learn.map((n) => `『${n.title}』(${n.category})`).join(", ")}`);
  if (e.item) p.push(`アイテム: ${e.item}`);
  return p.join(" / ");
}

const L: string[] = [];
L.push("# 23:30 — NIGHT TRAIN MYSTERY 設計書");
L.push("");
L.push("> このファイルは `src/lib/night-train.ts` から自動生成されます。直接編集しないでください。");
L.push("> 再生成: `npm run gen:nt-doc`");
L.push("");

L.push("## 事件");
L.push(`- 被害者: ${NIGHT_TRAIN.victim}`);
L.push(`- 犯人: **${charName[NIGHT_TRAIN.culpritId]}**`);
L.push(`- 決め手フラグ: ${NIGHT_TRAIN.solutionFlags.map((f) => flagLabel[f] ?? f).join(" / ")}`);
L.push("");
L.push("### 真相");
for (const s of NIGHT_TRAIN.solution) L.push(`- ${s}`);
L.push("");

L.push("## 嘘と理由（全員）");
L.push("");
L.push("| 人物 | 役割 | 種別 | 嘘 | 隠している秘密 | 理由 |");
L.push("| --- | --- | --- | --- | --- | --- |");
for (const c of chars) {
  const s = SECRETS[c.id as CharId];
  const culprit = c.isCulprit ? " ★犯人" : "";
  L.push(
    `| ${c.name}${culprit} | ${c.role} | ${LIE_TYPE_LABEL[s.type]} | ${s.lie} | ${s.secret} | ${s.reason} |`,
  );
}
L.push("");

L.push("## メンバー詳細（会話・解放条件）");
L.push("");
for (const c of chars) {
  L.push(`### ${c.name}（${c.role}）${c.isCulprit ? "★犯人" : ""}`);
  const s = SECRETS[c.id as CharId];
  L.push(`- プロフィール: ${c.bio}`);
  L.push(`- 初期位置: ${NIGHT_TRAIN.rooms.find((r) => r.id === c.startRoom)?.name ?? c.startRoom}`);
  L.push(`- 嘘[${LIE_TYPE_LABEL[s.type]}]: ${s.lie}`);
  L.push(`- 秘密: ${s.secret}`);
  L.push(`- 理由: ${s.reason}`);
  L.push("");
  L.push("**初手セリフ（状態で分岐）**");
  for (const g of c.greetings) {
    const pr = g.priority != null ? ` _(優先${g.priority})_` : "";
    L.push(`- 条件【${cond(g.when)}】${pr} → 「${g.text}」`);
  }
  L.push("");
  L.push("**質問トピック**");
  for (const t of c.topics) {
    const eff = effect(t.effect);
    L.push(`- [${t.label}] 条件【${cond(t.when)}】`);
    L.push(`  - 返答: 「${t.reply}」`);
    if (eff) L.push(`  - 効果: ${eff}`);
  }
  L.push("");
}

L.push("## 解放の早見表");
L.push("");
L.push("「どの会話が、どのフラグ／情報を立て、何の解放につながるか」。");
L.push("");
L.push("| 立つフラグ／情報 | 立てる会話 | 解放されるもの（このフラグ/情報を条件に持つ会話） |");
L.push("| --- | --- | --- |");
// produce: for each flag/known id, which topic sets it, and which greeting/topic requires it.
const setters: Record<string, string[]> = {};
const requirers: Record<string, string[]> = {};
function reqAdd(ids: string[] | undefined, who: string) {
  for (const id of ids ?? []) (requirers[id] ??= []).push(who);
}
for (const c of chars) {
  for (const t of c.topics) {
    const who = `${c.name}[${t.label}]`;
    for (const f of t.effect?.flags ?? []) (setters[f] ??= []).push(who);
    for (const n of t.effect?.learn ?? []) (setters[n.id] ??= []).push(who);
    reqAdd(t.when?.flags, who);
    reqAdd(t.when?.known, who);
  }
  for (const g of c.greetings) {
    reqAdd(g.when?.flags, `${c.name}[初手]`);
    reqAdd(g.when?.known, `${c.name}[初手]`);
  }
}
const allIds = Array.from(new Set([...Object.keys(setters), ...Object.keys(requirers)]));
for (const id of allIds) {
  const name = flagLabel[id] ?? knownLabel[id] ?? id;
  L.push(
    `| ${name} | ${(setters[id] ?? ["—"]).join(", ")} | ${(requirers[id] ?? ["—"]).join(", ")} |`,
  );
}
L.push("");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, L.join("\n"), "utf8");
console.log(`生成しました: ${OUT}  (${chars.length}人 / ${L.length}行)`);
