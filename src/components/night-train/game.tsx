"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Gavel,
  Heart,
  Map as MapIcon,
  MessageCircle,
  RotateCcw,
  TrainFront,
  Users,
  X,
} from "lucide-react";
import titleBg from "./title-bg.jpg";
import { AVATARS } from "./avatars";
import { ROOM_BG } from "./backgrounds";
import { OBJECTIVE_ARROW, PROGRESS_ICON, MAP_ICON } from "./decor";
import {
  NIGHT_TRAIN,
  availableTopics,
  charactersIn,
  chooseGreeting,
  evalAccusation,
  getBusy,
  getCharacter,
  getEnding,
  type CharId,
  type NTNote,
  type NTTopic,
  type NTView,
  type SceneLine,
  type RoomId,
} from "@/lib/night-train";

const STORAGE_KEY = "nt:night-train";

type Phase = "title" | "opening" | "play" | "accuse" | "result";

type GState = {
  phase: Phase;
  location: RoomId;
  flags: string[];
  known: string[];
  affinity: Record<string, number>;
  talkedOrder: string[];
  usedTopics: string[];
  notebook: NTNote[];
  /** 人物ごとの会話ログ（再入室時に前回の内容を再表示するため保存）。 */
  chatLogs: Record<string, SceneLine[]>;
  accusedId: CharId | null;
  endingId: string | null;
};

const INITIAL: GState = {
  phase: "title",
  location: "corridor",
  flags: [],
  known: [],
  affinity: {},
  talkedOrder: [],
  usedTopics: [],
  notebook: [],
  chatLogs: {},
  accusedId: null,
  endingId: null,
};

type Action =
  | { type: "load"; state: GState }
  | { type: "open" }
  | { type: "play" }
  | { type: "travel"; room: RoomId }
  | { type: "talk"; id: CharId }
  | { type: "flag"; flag: string }
  | { type: "chatlog"; id: CharId; log: SceneLine[] }
  | { type: "topic"; id: CharId; topic: NTTopic }
  | { type: "accuseScreen" }
  | { type: "accuse"; id: CharId }
  | { type: "giveup" }
  | { type: "reset" };

function uniq(a: string[]): string[] {
  return Array.from(new Set(a));
}

function reducer(s: GState, a: Action): GState {
  switch (a.type) {
    case "load":
      // 旧セーブに無い新フィールド（chatLogs 等）を初期値で補う。
      return { ...INITIAL, ...a.state };
    case "open":
      return { ...s, phase: "opening" };
    case "play":
      // OPENING の続き。廊下に集まった場面（私「何かあったんですか？」）から始まる。
      return { ...s, phase: "play", location: "corridor" };
    case "travel":
      return { ...s, location: a.room };
    case "talk":
      return s.talkedOrder.includes(a.id)
        ? s
        : { ...s, talkedOrder: [...s.talkedOrder, a.id] };
    case "flag":
      return s.flags.includes(a.flag)
        ? s
        : { ...s, flags: [...s.flags, a.flag] };
    case "chatlog":
      return { ...s, chatLogs: { ...s.chatLogs, [a.id]: a.log } };
    case "topic": {
      const eff = a.topic.effect;
      let { flags, known, affinity, notebook } = s;
      const usedTopics = uniq([...s.usedTopics, `${a.id}:${a.topic.id}`]);
      if (eff?.flags) flags = uniq([...flags, ...eff.flags]);
      if (eff?.affinity)
        affinity = { ...affinity, [a.id]: (affinity[a.id] ?? 0) + eff.affinity };
      if (eff?.learn) {
        const k = [...known];
        const n = [...notebook];
        for (const note of eff.learn) {
          if (!k.includes(note.id)) {
            k.push(note.id);
            n.push(note);
          }
        }
        known = k;
        notebook = n;
      }
      return { ...s, flags, known, affinity, notebook, usedTopics };
    }
    case "accuseScreen":
      return { ...s, phase: "accuse" };
    case "accuse":
      return {
        ...s,
        phase: "result",
        accusedId: a.id,
        endingId: evalAccusation(a.id),
      };
    case "giveup":
      return { ...s, phase: "result", accusedId: null, endingId: "unsolved" };
    case "reset":
      return INITIAL;
    default:
      return s;
  }
}

/** Brass accent for the dark train theme (overrides the scenario's site-card color). */
const ACCENT = "#c9a24b";

/**
 * Wraps every game screen in the "night train" dark theme: it re-defines the
 * site's `--color-*` tokens to a wood/leather/brass palette *scoped to the
 * game only*, plus a warm lamp glow + vignette. The rest of the site keeps the
 * cream theme because these overrides live on `.nt-theme`, not `:root`.
 */
function GameFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="nt-theme fixed inset-0 z-40 flex flex-col overflow-hidden">
      {children}
      <style>{`
        .nt-theme {
          --color-cream: #1b140f;
          --color-cream-deep: #120d09;
          --color-cream-soft: #33251b;
          --color-paper: #2a1d16;
          --color-paper-edge: #3c2a1e;
          --color-ink: #efe3ca;
          --color-ink-muted: #c8b390;
          --color-ink-soft: #9a8763;
          --color-line: #4a3625;
          --color-line-soft: #3a2a1d;
          color: var(--color-ink);
          background-color: #15100c;
          background-image:
            radial-gradient(120% 70% at 50% -8%, rgba(201,162,75,0.14), transparent 60%),
            radial-gradient(80% 50% at 12% 8%, rgba(180,90,40,0.10), transparent 70%),
            linear-gradient(180deg, #1d150f 0%, #15100c 55%, #100b07 100%);
          box-shadow: inset 0 0 160px rgba(0,0,0,0.6);
        }
      `}</style>
    </div>
  );
}

export function NightTrainGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [ready, setReady] = useState(false);
  const [activeChar, setActiveChar] = useState<CharId | null>(null);
  const [overlay, setOverlay] = useState<"none" | "map" | "reset">("none");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "load", state: JSON.parse(raw) as GState });
    } catch {
      /* corrupt save — start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [ready, state]);

  // 一時通知は数秒で消える。
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  const view: NTView = {
    flags: state.flags,
    known: state.known,
    affinity: state.affinity,
    talkedOrder: state.talkedOrder,
    usedTopics: state.usedTopics,
  };

  function openTalk(id: CharId) {
    const char = getCharacter(id);
    // 治療中などで話せない相手は「会話済み」に記録しない（進行中バッジを付けない）。
    if (char && getBusy(char, state.flags)) {
      setActiveChar(id);
      return;
    }
    dispatch({ type: "talk", id });
    setActiveChar(id);
  }
  function closeTalk() {
    setActiveChar(null);
  }
  function pickTopic(id: CharId, topic: NTTopic) {
    dispatch({ type: "topic", id, topic });
  }
  function fullReset() {
    dispatch({ type: "reset" });
    closeTalk();
    setOverlay("none");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  // ---- screens ----------------------------------------------------------
  if (state.phase === "title") {
    return (
      <GameFrame>
        <TitleScreen hasSave={state.talkedOrder.length > 0 || state.known.length > 0} onStart={() => dispatch({ type: "play" })} onReset={fullReset} />
      </GameFrame>
    );
  }
  if (state.phase === "result" && state.endingId) {
    return (
      <GameFrame>
        <ResultScreen
          endingId={state.endingId}
          onReset={fullReset}
          onRetry={() => dispatch({ type: "accuseScreen" })}
        />
      </GameFrame>
    );
  }
  if (state.phase === "accuse") {
    return (
      <GameFrame>
        <AccuseScreen
          onBack={() => dispatch({ type: "play" })}
          onAccuse={(id) => dispatch({ type: "accuse", id })}
          onGiveUp={() => dispatch({ type: "giveup" })}
        />
      </GameFrame>
    );
  }

  // ---- play -------------------------------------------------------------
  const room = NIGHT_TRAIN.rooms.find((r) => r.id === state.location)!;
  const here = charactersIn(state.location);
  const active = activeChar ? getCharacter(activeChar) : null;

  // 廊下では、タイトル/OPENINGと同じ背景画像を敷く。
  const roomBg = ROOM_BG[state.location];
  const showBg = !!roomBg;
  // その部屋に初めて入ったら、スクリプトシーンを自動再生する。
  const scene = NIGHT_TRAIN.scenes[state.location];
  const playScene =
    !!scene && !state.flags.includes(`scene-${state.location}-seen`);
  // 廊下のシーンを見終える（目的が出る）まで、移動・メモ・最初からは解禁しない。
  const unlocked = state.flags.includes("scene-corridor-seen");

  // 進行に応じた「次にすること」のガイド。
  const solved = NIGHT_TRAIN.solutionFlags.every((f) => state.flags.includes(f));
  const nextStep = solved
    ? "決め手は揃った。〈告発〉で犯人を名指ししよう。"
    : state.flags.includes("tried-mop")
      ? "ほかに内鍵を開けられそうなものを探そう。"
      : state.flags.includes("scene-corridor-seen")
        ? "車掌室の内鍵を開けるものを探そう。"
        : state.talkedOrder.length === 0
          ? "" // 開始直後はまだ出さない
          : "各車両で聞き込みを続け、証言と証拠を集めよう。集めた手がかりは〈メモ〉で整理できる。";

  return (
    <GameFrame>
    <div className="relative flex h-full flex-col overflow-hidden">
      {showBg && roomBg && (
        <>
          <Backdrop src={roomBg.src} />
          <div aria-hidden className="absolute inset-0 bg-black/55" />
        </>
      )}

      {/* ヘッダー（上部固定） */}
      <div className="relative z-10 shrink-0">
        <div className="mx-auto w-full max-w-2xl px-4 pt-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                現在地
              </p>
              <p className="truncate font-serif text-lg text-[color:var(--color-ink)]">
                {room.name}
              </p>
              {room.desc && (
                <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--color-ink-soft)]">
                  {room.desc}
                </p>
              )}
            </div>
            {unlocked && (
              <div className="flex shrink-0 items-center gap-1.5">
                <HudButton onClick={() => setOverlay("map")} label="マップ">
                  {MAP_ICON ? (
                    <span
                      aria-hidden
                      className="-m-0.5 inline-block h-5 w-5 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${MAP_ICON})` }}
                    />
                  ) : (
                    <MapIcon size={15} strokeWidth={1.5} />
                  )}
                </HudButton>
                <HudButton onClick={() => setOverlay("reset")} label="最初から">
                  <RotateCcw size={15} strokeWidth={1.5} />
                </HudButton>
              </div>
            )}
          </div>
          {!active && nextStep && (
            <div
              className="mt-2 rounded-md border px-3 py-2 text-[11px] leading-relaxed"
              style={{ borderColor: ACCENT, backgroundColor: "#fbf7ec", color: "#1a1714" }}
            >
              {OBJECTIVE_ARROW ? (
                <span
                  aria-hidden
                  className="mr-1 inline-block h-3.5 w-3.5 translate-y-[2px] bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${OBJECTIVE_ARROW})` }}
                />
              ) : (
                <span style={{ color: ACCENT }}>▸ </span>
              )}
              {nextStep}
            </div>
          )}
        </div>
      </div>

      {/* 本体（このエリア内でスクロール）＋下部固定フッター */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 sm:px-6">
        {active ? (
          <TalkPanel
            key={active.id}
            charId={active.id}
            view={view}
            affinity={state.affinity[active.id] ?? 0}
            savedLog={state.chatLogs?.[active.id]}
            onLog={(log) => dispatch({ type: "chatlog", id: active.id, log })}
            onTopic={(t) => pickTopic(active.id, t)}
            onMeet={() => dispatch({ type: "flag", flag: `met-${active.id}` })}
            onClose={closeTalk}
          />
        ) : playScene ? (
          <SceneView
            lines={scene!}
            flags={state.flags}
            onFinish={() =>
              dispatch({ type: "flag", flag: `scene-${state.location}-seen` })
            }
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 mt-4 flex shrink-0 items-center gap-1.5 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
              <Users size={12} strokeWidth={1.5} />
              対象人物
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {here.length === 0 ? (
                <p className="py-8 text-center text-xs text-[color:var(--color-ink-soft)]">
                  誰もいない。マップから移動しよう。
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {here.map((c) => {
                    const talked = state.talkedOrder.includes(c.id);
                    const done = talked && availableTopics(c, view).length === 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          state.location === "shower"
                            ? setNotice("シャワー中のようだ。入るのはやめておこう。")
                            : openTalk(c.id)
                        }
                        aria-label="話を聞く"
                        className="relative flex flex-col items-center justify-center gap-1 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] py-4 transition hover:border-[color:var(--color-ink)]/40"
                      >
                        <div className="relative">
                          <Avatar id={c.id} initials={c.initials} size={60} />
                          {/* アバターの下端に [アイコン]＋テキスト のピルを重ねる */}
                          {talked && (
                            <span
                              className="absolute -bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-cream)]/95 px-1.5 py-0.5 text-[8px] tracking-[0.1em]"
                              style={{ color: ACCENT }}
                            >
                              {done ? (
                                <Check size={10} strokeWidth={2.5} />
                              ) : PROGRESS_ICON ? (
                                <span
                                  aria-hidden
                                  className="inline-block h-3 w-3 bg-contain bg-center bg-no-repeat"
                                  style={{ backgroundImage: `url(${PROGRESS_ICON})` }}
                                />
                              ) : (
                                <MessageCircle size={10} strokeWidth={2} />
                              )}
                              {done ? "完了" : "進行中"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {solved && (
              <div className="shrink-0 pb-2 pt-3">
                <button
                  onClick={() => dispatch({ type: "accuseScreen" })}
                  className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  推理がまとまった — 告発する
                  <Gavel size={13} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {overlay === "map" && (
        <MapOverlay
          current={state.location}
          flags={state.flags}
          onTravel={(r) => {
            dispatch({ type: "travel", room: r });
            closeTalk();
            setOverlay("none");
          }}
          onClose={() => setOverlay("none")}
        />
      )}
      {overlay === "reset" && (
        <Overlay title="最初から" onClose={() => setOverlay("none")}>
          <p className="text-sm leading-relaxed text-[color:var(--color-ink)]">
            最初からやり直しますか？
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
            集めた証言・証拠・親密度はすべて消えます。
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setOverlay("none")}
              className="inline-flex flex-1 items-center justify-center border border-[color:var(--color-line)] px-5 py-3 text-[11px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition hover:text-[color:var(--color-ink)]"
            >
              やめる
            </button>
            <button
              onClick={fullReset}
              className="inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              最初から
            </button>
          </div>
        </Overlay>
      )}

      {/* 一時通知 */}
      {notice && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-6">
          <div className="max-w-sm rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-cream)]/95 px-4 py-3 text-center text-xs leading-relaxed text-[color:var(--color-ink)] shadow-[0_6px_20px_rgba(0,0,0,0.4)] backdrop-blur">
            {notice}
          </div>
        </div>
      )}
    </div>
    </GameFrame>
  );
}

// ---------------------------------------------------------------------------

function HudButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-2.5 py-2 text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-cream-soft)]"
    >
      {children}
    </button>
  );
}

/** 円形アバター。登録アイコンがあれば画像、無ければイニシャル円。 */
function Avatar({
  id,
  initials,
  size,
}: {
  id: CharId;
  initials: string;
  size: number;
}) {
  const img = AVATARS[id];
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: ACCENT }}
    >
      {img ? (
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${img.src})` }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center tracking-wider text-[color:var(--color-paper)]"
          style={{ fontSize: Math.round(size * 0.3) }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

/** 親密度ステータス（ラベル＋ハート3つ：取得分は塗り、残りは枠）。 */
function AffinityStatus({ value }: { value: number }) {
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <span className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
        親密度
      </span>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => {
          const on = i < value;
          return (
            <Heart
              key={i}
              size={11}
              strokeWidth={on ? 0 : 1.5}
              fill={on ? ACCENT : "transparent"}
              className={on ? "" : "text-[color:var(--color-ink-soft)]"}
            />
          );
        })}
      </span>
    </div>
  );
}

/** 1行のチャット表示。narration=地の文 / me=主人公(右) / CharId=その人物(左)。 */
function ChatLine({ line, flags }: { line: SceneLine; flags: string[] }) {
  if (line.who === "narration") {
    return (
      <p className="text-xs italic leading-relaxed text-[color:var(--color-ink-muted)] [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
        {line.text}
      </p>
    );
  }
  if (line.who === "me") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5"
          style={{ backgroundColor: ACCENT }}
        >
          <p className="text-xs leading-relaxed text-[color:var(--color-paper)]">
            {line.text}
          </p>
        </div>
      </div>
    );
  }
  const ch = getCharacter(line.who);
  const known = ch ? flags.includes(`met-${ch.id}`) : false;
  return (
    <div className="flex items-end gap-2">
      {ch && <Avatar id={ch.id} initials={ch.initials} size={28} />}
      <div className="max-w-[80%]">
        {ch && known && (
          <p className="mb-0.5 text-[9px] tracking-[0.15em] text-[color:var(--color-ink-soft)]">
            {ch.name}
          </p>
        )}
        <div className="rounded-2xl rounded-bl-sm border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed text-[color:var(--color-ink)]">
            {line.text}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 部屋で自動再生されるスクリプトシーン。タップで1メッセージずつ送る。
 *  話者は narration（地の文）/ me（主人公）/ CharId（その人物）に対応。 */
function SceneView({
  lines,
  flags,
  onFinish,
}: {
  lines: SceneLine[];
  flags: string[];
  onFinish: () => void;
}) {
  const [shown, setShown] = useState(1);
  const done = shown >= lines.length;
  const endRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが出たら、その位置まで自動スクロール（上見切れ防止）。
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [shown]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-6">
        {lines.slice(0, shown).map((m, i) => (
          <ChatLine key={i} line={m} flags={flags} />
        ))}
        <div ref={endRef} />
      </div>

      {/* つづき（下部固定） */}
      <div className="shrink-0 pb-2 pt-3">
        <button
          onClick={() => (done ? onFinish() : setShown((s) => s + 1))}
          className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-[11px] tracking-[0.25em] transition"
          style={
            done
              ? { backgroundColor: ACCENT, color: "var(--color-paper)" }
              : {
                  border: "1px solid var(--color-line)",
                  color: "var(--color-ink-muted)",
                }
          }
        >
          次へ
        </button>
      </div>
    </div>
  );
}

/**
 * チャットノベル形式の聞き込み。相手のセリフを左、自分の質問を右の吹き出しで
 * 積み上げ、選択肢はクイック返信として下に出す。1人ぶんの会話履歴は session
 * 内で保持（charId を key に remount されるので相手を変えるとリセット）。
 * トピックは単発 reply のほか、複数話者の小芝居（script）も流せる。
 */
function TalkPanel({
  charId,
  view,
  affinity,
  savedLog,
  onLog,
  onTopic,
  onMeet,
  onClose,
}: {
  charId: CharId;
  view: NTView;
  affinity: number;
  savedLog?: SceneLine[];
  onLog: (log: SceneLine[]) => void;
  onTopic: (t: NTTopic) => void;
  onMeet: () => void;
  onClose: () => void;
}) {
  const char = getCharacter(charId)!;
  // 名乗ってもらうまでは素性不明。
  const met = view.flags.includes(`met-${charId}`);
  const busy = getBusy(char, view.flags);
  // 前回の会話があれば再表示。無ければあいさつから。
  const [log, setLog] = useState<SceneLine[]>(() =>
    savedLog && savedLog.length
      ? savedLog
      : [{ who: charId, text: chooseGreeting(char, view) }],
  );
  const topics = availableTopics(char, view);

  /** ログを更新しつつ親にも保存する。 */
  function pushLog(...lines: SceneLine[]) {
    const next = [...log, ...lines];
    setLog(next);
    onLog(next);
  }
  // 台本（script）は1メッセージずつ「次へ」で送る。未表示ぶんをここに溜める。
  const [queue, setQueue] = useState<SceneLine[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // 新しい発言が出たら、その位置まで自動スクロール（上見切れ防止）。
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [log, queue]);

  function pick(t: NTTopic) {
    // 単発返答も台本も、最初の1行だけ出して残りは「次へ」で送る。
    const body: SceneLine[] = t.script ?? [{ who: charId, text: t.reply ?? "" }];
    const lines: SceneLine[] = t.hideLabel
      ? body
      : [{ who: "me", text: t.label }, ...body];
    pushLog(lines[0]);
    setQueue(lines.slice(1));
    // 名前が分かるのは、ちゃんと捜査（phase2トピック）で話を聞いたとき。
    if (!met && t.phase2) onMeet();
    onTopic(t);
  }

  function advance() {
    if (queue.length === 0) return;
    pushLog(queue[0]);
    setQueue((q) => q.slice(1));
  }

  // 治療中などで話しかけられない場合は、会話欄に状況だけ表示する。
  if (busy) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-[color:var(--color-line)]/60 pb-3 pt-5">
          <Avatar id={char.id} initials={char.initials} size={44} />
          <p className="text-sm font-medium text-[color:var(--color-ink)]">？？？</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-6">
          <p className="text-xs italic leading-relaxed text-[color:var(--color-ink-muted)]">
            {busy}
          </p>
        </div>
        <div className="shrink-0 pb-2 pt-3">
          <button
            onClick={onClose}
            className="inline-flex w-full items-center justify-center px-6 py-3 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            会話を終える
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 相手ヘッダー（固定） */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[color:var(--color-line)]/60 pb-3 pt-5">
        <Avatar id={char.id} initials={char.initials} size={44} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink)]">
            {met ? char.name : "？？？"}
            {met && (
              <span className="text-[10px] tracking-[0.15em] text-[color:var(--color-ink-soft)]">
                {char.role}
              </span>
            )}
          </p>
          {met && <AffinityStatus value={affinity} />}
        </div>
      </div>

      {/* チャットログ（スクロール） */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto py-4">
        {log.map((m, i) => (
          <ChatLine key={i} line={m} flags={view.flags} />
        ))}
        <div ref={endRef} />
      </div>

      {/* 下部固定。台本送り中は「次へ」だけ。送り終えたら選択肢＋会話を終える。 */}
      <div className="shrink-0 space-y-2 pb-2 pt-3">
        {queue.length > 0 ? (
          <button
            onClick={advance}
            className="inline-flex w-full items-center justify-center px-6 py-3 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            次へ
          </button>
        ) : (
          <>
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t)}
                className="flex w-full items-center gap-2 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-paper)] px-4 py-2.5 text-left text-xs text-[color:var(--color-ink)] transition hover:border-[color:var(--color-ink)]/40"
              >
                <ChevronRight size={13} strokeWidth={1.5} style={{ color: ACCENT }} />
                {t.label}
              </button>
            ))}
            <button
              onClick={onClose}
              className="inline-flex w-full items-center justify-center px-6 py-3 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              会話を終える
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MapOverlay({
  current,
  flags,
  onTravel,
  onClose,
}: {
  current: RoomId;
  flags: string[];
  onTravel: (r: RoomId) => void;
  onClose: () => void;
}) {
  const rooms = [...NIGHT_TRAIN.rooms].sort((a, b) => a.order - b.order);
  const [tab, setTab] = useState<"map" | "quest">("map");

  const tabs = (
    <div className="flex items-center gap-2">
      {(["map", "quest"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className="px-2 py-1 text-[10px] tracking-[0.25em] transition"
          style={
            tab === t
              ? { color: ACCENT, borderBottom: `1px solid ${ACCENT}` }
              : { color: "var(--color-ink-soft)" }
          }
        >
          {t === "map" ? "車内マップ" : "クエスト"}
        </button>
      ))}
    </div>
  );

  return (
    <Overlay title={tabs} onClose={onClose}>
      <div className="h-[55vh] overflow-y-auto">
      {tab === "quest" ? (
        <div className="space-y-1.5">
          {NIGHT_TRAIN.quests.map((q) => {
            const unlocked = !q.unlock || flags.includes(q.unlock);
            const ch = q.char ? getCharacter(q.char) : undefined;
            return (
              <div
                key={q.name}
                className={`flex items-center gap-2 border px-3 py-2 text-sm ${
                  unlocked
                    ? "border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-[color:var(--color-ink)]"
                    : "border-[color:var(--color-line)]/40 bg-[color:var(--color-paper)]/40 text-[color:var(--color-ink-soft)] opacity-50"
                }`}
              >
                {ch && <Avatar id={ch.id} initials={ch.initials} size={24} />}
                {q.name}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {rooms.map((r) => {
          const occupants = charactersIn(r.id);
          const isHere = r.id === current;
          const bg = ROOM_BG[r.id]?.src;
          return (
            <button
              key={r.id}
              onClick={() => onTravel(r.id)}
              disabled={isHere}
              className="relative flex w-full items-center gap-3 overflow-hidden rounded border p-3 text-left transition disabled:cursor-default"
              style={{
                borderColor: isHere ? ACCENT : "var(--color-line)",
                backgroundColor: bg ? undefined : "var(--color-paper)",
              }}
            >
              {/* 部屋背景。現在地は通常彩度、他は低彩度。 */}
              {bg && (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${bg})`,
                    filter: isHere ? undefined : "saturate(0.3)",
                  }}
                />
              )}
              {bg && (
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundColor: isHere ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.62)" }}
                />
              )}
              <span className="relative z-10 shrink-0 text-sm text-[color:var(--color-ink)] [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                {r.name}
              </span>
              {occupants.length > 0 && (
                <span className="relative z-10 inline-flex items-center -space-x-1.5">
                  {occupants.map((c) => (
                    <Avatar key={c.id} id={c.id} initials={c.initials} size={20} />
                  ))}
                </span>
              )}
              {!isHere && (
                <ChevronRight size={14} strokeWidth={1.5} className="relative z-10 ml-auto text-[color:var(--color-paper)]" />
              )}
            </button>
          );
        })}
        </div>
      )}
      </div>
    </Overlay>
  );
}

function Overlay({
  title,
  children,
  onClose,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="relative mt-auto max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-[color:var(--color-line)] bg-[color:var(--color-cream)] p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] sm:mb-6 sm:mt-auto sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          {title}
          <button onClick={onClose} aria-label="閉じる" className="shrink-0 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 同梱画像の背景＋可読性のための暗幕＋琥珀グロー。タイトル/OPENINGで共用。 */
function Backdrop({ src }: { src: string }) {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, rgba(201,162,75,0.18), transparent 55%), linear-gradient(180deg, rgba(16,11,7,0.55) 0%, rgba(16,11,7,0.66) 55%, rgba(16,11,7,0.94) 100%)",
        }}
      />
    </>
  );
}

function TitleScreen({
  hasSave,
  onStart,
  onReset,
}: {
  hasSave: boolean;
  onStart: () => void;
  onReset: () => void;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <Backdrop src={titleBg.src} />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
      <TrainFront size={28} strokeWidth={1.25} style={{ color: ACCENT }} />
      <p className="mt-4 text-[10px] tracking-[0.4em] text-[color:var(--color-ink-soft)]">
        {NIGHT_TRAIN.reading}
      </p>
      <h1 className="mt-2 font-serif text-[34px] leading-tight text-[color:var(--color-ink)] sm:text-[44px]">
        真夜中の寝台列車
      </h1>
      <p className="mt-4 max-w-sm whitespace-pre-line text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
        {NIGHT_TRAIN.tagline}
      </p>
      <button
        onClick={onStart}
        className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[11px] tracking-[0.3em] text-[color:var(--color-paper)] transition hover:opacity-90"
        style={{ backgroundColor: ACCENT }}
      >
        {hasSave ? "つづきから" : "はじめる"}
      </button>
      {hasSave && (
        <button
          onClick={onReset}
          className="mt-3 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-ink)]"
        >
          <RotateCcw size={11} strokeWidth={1.5} />
          最初から
        </button>
      )}
      </div>
    </div>
  );
}

function AccuseScreen({
  onBack,
  onAccuse,
  onGiveUp,
}: {
  onBack: () => void;
  onAccuse: (id: CharId) => void;
  onGiveUp: () => void;
}) {
  const [sel, setSel] = useState<CharId | null>(null);
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-8 sm:px-6">
      <p className="text-[10px] tracking-[0.3em]" style={{ color: ACCENT }}>
        告発
      </p>
      <h2 className="mt-1 font-serif text-[26px] leading-tight text-[color:var(--color-ink)]">
        犯人は誰だ？
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
        証言と証拠を頼りに、ひとりを名指しする。確信がなければ、まだ捜査を続けてもいい。
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {NIGHT_TRAIN.characters.map((c) => {
          const active = sel === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSel(c.id)}
              className="flex items-center gap-2 border p-3 text-left transition"
              style={
                active
                  ? { borderColor: ACCENT, backgroundColor: "var(--color-paper)" }
                  : { borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }
              }
            >
              <Avatar id={c.id} initials={c.initials} size={32} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[color:var(--color-ink)]">
                  {c.name}
                </p>
                <p className="truncate text-[9px] tracking-[0.1em] text-[color:var(--color-ink-soft)]">
                  {c.role}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 border border-[color:var(--color-line)] px-5 py-3.5 text-[11px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition hover:text-[color:var(--color-ink)]"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          捜査へ戻る
        </button>
        <button
          onClick={() => sel && onAccuse(sel)}
          disabled={!sel}
          className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] transition disabled:cursor-not-allowed"
          style={
            sel
              ? { backgroundColor: ACCENT, color: "var(--color-paper)" }
              : { backgroundColor: "var(--color-cream-soft)", color: "var(--color-ink-soft)" }
          }
        >
          この人物を告発する
          <Gavel size={13} strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onGiveUp}
          className="text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-ink)]"
        >
          捜査をやめる（未解決）
        </button>
      </div>
    </div>
  );
}

function ResultScreen({
  endingId,
  onReset,
  onRetry,
}: {
  endingId: string;
  onReset: () => void;
  onRetry: () => void;
}) {
  const ending = getEnding(endingId);
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-10">
      <p className="text-[10px] tracking-[0.3em]" style={{ color: ACCENT }}>
        {ending.good ? "解決" : "ENDING"}
      </p>
      <h2 className="mt-1 font-serif text-[28px] leading-tight text-[color:var(--color-ink)]">
        {ending.title}
      </h2>
      <div className="mt-5 space-y-4 border-l-2 pl-4" style={{ borderColor: ACCENT }}>
        {ending.body.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-[color:var(--color-ink)]">
            {p}
          </p>
        ))}
      </div>

      {ending.good && (
        <div className="mt-6 bg-[color:var(--color-cream-soft)] border border-[color:var(--color-line)]/60 p-4">
          <p className="mb-2 text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            真相
          </p>
          <div className="space-y-2">
            {NIGHT_TRAIN.solution.map((p, i) => (
              <p key={i} className="text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {!ending.good && (
          <button
            onClick={onRetry}
            className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            もう一度告発する
            <Gavel size={13} strokeWidth={1.75} />
          </button>
        )}
        <button
          onClick={onReset}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] transition ${
            ending.good
              ? "flex-1 text-[color:var(--color-paper)] hover:opacity-90"
              : "border border-[color:var(--color-line)] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
          }`}
          style={ending.good ? { backgroundColor: ACCENT } : undefined}
        >
          <RotateCcw size={12} strokeWidth={1.5} />
          最初から
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link href="/murder-mystery" className="text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
          ほかの事件を見る
        </Link>
      </div>
    </div>
  );
}
