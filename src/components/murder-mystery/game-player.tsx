"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Gavel,
  Lock,
  MapPin,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import {
  chooseStatement,
  DIFFICULTY_LABEL,
  type MMScenario,
} from "@/lib/murder-mystery";

type Phase = "intro" | "investigate" | "accuse" | "result";

type SavedState = {
  phase: Phase;
  discovered: string[];
  accusedId: string | null;
  /** Suspect ids in the order first questioned. */
  questionedOrder?: string[];
  /** Topics unlocked by testimony. */
  topics?: string[];
  /** Currently-shown testimony line per suspect. */
  testimonies?: Record<string, string>;
};

const STORAGE_PREFIX = "mm:";

/** Visible, enabled elements the D-pad cursor can land on, in DOM order. */
function getFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-focusable]"),
  ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
}

/**
 * Single-player murder-mystery engine. Runs entirely client-side and persists
 * progress to localStorage so a refresh resumes where the player left off.
 * Flow: intro → investigate (reveal clues) → accuse (pick suspect) → result.
 *
 * Playable two ways at once: tap/click anything directly, or drive it like a
 * game with the on-screen D-pad (bottom-right) / arrow keys + Enter. The D-pad
 * moves a focus cursor over the `data-focusable` targets and "決定" clicks them.
 */
export function GamePlayer({ scenario }: { scenario: MMScenario }) {
  const storageKey = STORAGE_PREFIX + scenario.id;

  const [phase, setPhase] = useState<Phase>("intro");
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [accusedId, setAccusedId] = useState<string | null>(null);
  /** Suspect highlighted (not yet committed) during the accuse phase. */
  const [selected, setSelected] = useState<string | null>(null);
  /** Interrogation: who was questioned (in order), what they said, what we learned. */
  const [questionedOrder, setQuestionedOrder] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [testimonies, setTestimonies] = useState<Record<string, string>>({});
  const [focusIndex, setFocusIndex] = useState(0);
  // Hydration guard: render the intro on the server, swap in saved state after mount.
  const [ready, setReady] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw) as SavedState;
        if (s.phase) setPhase(s.phase);
        if (Array.isArray(s.discovered)) setDiscovered(s.discovered);
        if (typeof s.accusedId === "string") setAccusedId(s.accusedId);
        if (Array.isArray(s.questionedOrder)) setQuestionedOrder(s.questionedOrder);
        if (Array.isArray(s.topics)) setTopics(s.topics);
        if (s.testimonies && typeof s.testimonies === "object")
          setTestimonies(s.testimonies);
      }
    } catch {
      /* corrupt save — ignore and start fresh */
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    const state: SavedState = {
      phase,
      discovered,
      accusedId,
      questionedOrder,
      topics,
      testimonies,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* storage full / blocked — progress just won't persist */
    }
  }, [
    ready,
    phase,
    discovered,
    accusedId,
    questionedOrder,
    topics,
    testimonies,
    storageKey,
  ]);

  /** Change phase and re-home the D-pad cursor to the first target. */
  const goPhase = useCallback((p: Phase) => {
    setPhase(p);
    setFocusIndex(0);
  }, []);

  function reset() {
    setPhase("intro");
    setDiscovered([]);
    setAccusedId(null);
    setSelected(null);
    setQuestionedOrder([]);
    setTopics([]);
    setTestimonies({});
    setFocusIndex(0);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  function reveal(id: string) {
    setDiscovered((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  /**
   * Question a suspect. The line they give depends on current state — who has
   * already been questioned (order), which clues are in hand, what's been
   * learned — so re-questioning after new findings can yield a new answer.
   */
  function interrogate(id: string) {
    const char = scenario.characters.find((c) => c.id === id);
    if (!char) return;
    const line = chooseStatement(char, { questionedOrder, discovered, topics });
    if (!questionedOrder.includes(id)) {
      setQuestionedOrder((prev) => [...prev, id]);
    }
    if (line.unlocks?.length) {
      setTopics((prev) =>
        Array.from(new Set([...prev, ...line.unlocks!])),
      );
    }
    setTestimonies((prev) => ({ ...prev, [id]: line.text }));
  }

  // --- D-pad / keyboard control -------------------------------------------
  const move = useCallback((delta: number) => {
    const items = getFocusables(fieldRef.current);
    if (!items.length) return;
    setFocusIndex((i) => {
      const cur = Math.min(i, items.length - 1);
      return Math.max(0, Math.min(items.length - 1, cur + delta));
    });
  }, []);

  const confirm = useCallback(() => {
    const items = getFocusables(fieldRef.current);
    if (!items.length) return;
    const cur = items[Math.min(focusIndex, items.length - 1)];
    cur?.click();
  }, [focusIndex]);

  // Paint the focus ring on the current target (DOM-only side effect).
  useEffect(() => {
    const items = getFocusables(fieldRef.current);
    items.forEach((el) => el.classList.remove("mm-focus"));
    if (!items.length) return;
    const cur = items[Math.min(focusIndex, items.length - 1)];
    if (cur) {
      cur.classList.add("mm-focus");
      cur.scrollIntoView({ block: "nearest" });
    }
  }, [phase, focusIndex, discovered, selected, accusedId, testimonies, ready]);

  // Hardware arrow keys + Enter mirror the on-screen pad.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          move(-1);
          break;
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          move(1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          confirm();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, confirm]);

  const allFound = discovered.length === scenario.clues.length;
  const culprit = scenario.characters.find((c) => c.isCulprit)!;
  const accused = scenario.characters.find((c) => c.id === accusedId) ?? null;
  const correct = accusedId === culprit.id;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pb-44 sm:px-6">
        {/* Top bar: back to list + reset */}
        <div className="flex items-center justify-between py-3">
          <Link
            href="/murder-mystery"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition hover:text-[color:var(--color-ink)]"
          >
            <ArrowLeft size={12} strokeWidth={1.5} />
            一覧へ
          </Link>
          {phase !== "intro" && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition hover:text-[color:var(--color-ink)]"
            >
              <RotateCcw size={11} strokeWidth={1.5} />
              最初から
            </button>
          )}
        </div>

        <div
          ref={fieldRef}
          style={{ ["--mm-accent" as string]: scenario.color }}
        >
          <div className="h-1 w-full" style={{ backgroundColor: scenario.color }} />

          {phase === "intro" && (
            <IntroView
              scenario={scenario}
              onStart={() => goPhase("investigate")}
            />
          )}

          {phase === "investigate" && (
            <InvestigateView
              scenario={scenario}
              discovered={discovered}
              allFound={allFound}
              questionedOrder={questionedOrder}
              testimonies={testimonies}
              onInterrogate={interrogate}
              onReveal={reveal}
              onAccuse={() => goPhase("accuse")}
            />
          )}

          {phase === "accuse" && (
            <AccuseView
              scenario={scenario}
              selected={selected}
              onSelect={setSelected}
              onBack={() => goPhase("investigate")}
              onAccuse={(id) => {
                setAccusedId(id);
                goPhase("result");
              }}
            />
          )}

          {phase === "result" && accused && (
            <ResultView
              scenario={scenario}
              accused={accused}
              correct={correct}
              onRetry={() => goPhase("accuse")}
              onReset={reset}
            />
          )}
        </div>
      </div>

      <DPad accent={scenario.color} onMove={move} onConfirm={confirm} />

      <style>{`
        [data-focusable] { scroll-margin: 96px; }
        .mm-focus {
          outline: 2px solid var(--mm-accent, var(--color-ink));
          outline-offset: 3px;
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------

/** Fixed bottom-right game controller: cross D-pad + center 決定. */
function DPad({
  accent,
  onMove,
  onConfirm,
}: {
  accent: string;
  onMove: (delta: number) => void;
  onConfirm: () => void;
}) {
  const arrow =
    "flex items-center justify-center bg-[color:var(--color-paper)] text-[color:var(--color-ink)] border border-[color:var(--color-line)] active:bg-[color:var(--color-cream-soft)] transition select-none";
  return (
    <div className="fixed bottom-4 right-4 z-30 lg:bottom-6 lg:right-6">
      <div className="grid grid-cols-3 grid-rows-3 gap-1 rounded-2xl border border-[color:var(--color-line)]/70 bg-[color:var(--color-cream-deep)]/90 p-2 shadow-[0_6px_20px_rgba(0,0,0,0.16)] backdrop-blur-sm">
        <span />
        <button
          type="button"
          aria-label="上"
          onClick={() => onMove(-1)}
          className={`${arrow} h-10 w-10 rounded-t-lg`}
        >
          <ChevronUp size={18} strokeWidth={2} />
        </button>
        <span />

        <button
          type="button"
          aria-label="左"
          onClick={() => onMove(-1)}
          className={`${arrow} h-10 w-10 rounded-l-lg`}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="決定"
          onClick={onConfirm}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[9px] font-medium tracking-[0.1em] text-[color:var(--color-paper)] shadow-inner transition active:scale-95"
          style={{ backgroundColor: accent }}
        >
          決定
        </button>
        <button
          type="button"
          aria-label="右"
          onClick={() => onMove(1)}
          className={`${arrow} h-10 w-10 rounded-r-lg`}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>

        <span />
        <button
          type="button"
          aria-label="下"
          onClick={() => onMove(1)}
          className={`${arrow} h-10 w-10 rounded-b-lg`}
        >
          <ChevronDown size={18} strokeWidth={2} />
        </button>
        <span />
      </div>
    </div>
  );
}

function PhaseLabel({ children, color }: { children: string; color: string }) {
  return (
    <p
      className="mb-2 text-[10px] font-medium tracking-[0.3em]"
      style={{ color }}
    >
      {children}
    </p>
  );
}

function IntroView({
  scenario,
  onStart,
}: {
  scenario: MMScenario;
  onStart: () => void;
}) {
  return (
    <div className="pt-6">
      <PhaseLabel color={scenario.color}>CASE FILE</PhaseLabel>
      <h1 className="font-serif text-[34px] leading-tight text-[color:var(--color-ink)]">
        {scenario.title}
      </h1>
      {scenario.reading && (
        <p className="mt-1 text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
          {scenario.reading}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
        <span>{scenario.players}</span>
        <span>·</span>
        <span>{scenario.duration}</span>
        <span>·</span>
        <span>難易度 {DIFFICULTY_LABEL[scenario.difficulty]}</span>
      </div>

      <div className="mt-6 space-y-3 border-l-2 pl-4" style={{ borderColor: scenario.color }}>
        {scenario.intro.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-[color:var(--color-ink)]">
            {p}
          </p>
        ))}
      </div>

      <div className="mt-6 bg-[color:var(--color-cream-soft)] border border-[color:var(--color-line)]/60 p-4">
        <p className="text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)] mb-1">
          VICTIM
        </p>
        <p className="text-sm leading-relaxed text-[color:var(--color-ink-muted)]">
          {scenario.victim}
        </p>
      </div>

      <button
        data-focusable
        onClick={onStart}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
        style={{ backgroundColor: scenario.color }}
      >
        捜査をはじめる
        <ArrowRight size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function InvestigateView({
  scenario,
  discovered,
  allFound,
  questionedOrder,
  testimonies,
  onInterrogate,
  onReveal,
  onAccuse,
}: {
  scenario: MMScenario;
  discovered: string[];
  allFound: boolean;
  questionedOrder: string[];
  testimonies: Record<string, string>;
  onInterrogate: (id: string) => void;
  onReveal: (id: string) => void;
  onAccuse: () => void;
}) {
  return (
    <div className="pt-6">
      <PhaseLabel color={scenario.color}>尋問</PhaseLabel>
      <p className="-mt-1 mb-3 text-[10px] tracking-[0.1em] text-[color:var(--color-ink-soft)]">
        人物を選んで話を聞く（聞く順番で証言が変わる）
      </p>
      <div className="space-y-3">
        {scenario.characters.map((c) => {
          const turn = questionedOrder.indexOf(c.id); // -1 = まだ
          const said = testimonies[c.id];
          return (
            <button
              key={c.id}
              data-focusable
              onClick={() => onInterrogate(c.id)}
              className="block w-full border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-4 text-left transition hover:border-[color:var(--color-ink)]/40"
            >
              <div className="flex gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] tracking-widest text-[color:var(--color-paper)]"
                  style={{ backgroundColor: scenario.color }}
                >
                  {c.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center text-sm font-medium text-[color:var(--color-ink)]">
                    {c.name}
                    <span className="ml-2 text-[10px] tracking-[0.15em] text-[color:var(--color-ink-soft)]">
                      {c.role}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                      {turn >= 0 ? (
                        <>
                          <MessageCircle
                            size={11}
                            strokeWidth={1.5}
                            style={{ color: scenario.color }}
                          />
                          {turn + 1}人目
                        </>
                      ) : (
                        <>
                          尋問する
                          <ChevronRight size={12} strokeWidth={1.5} />
                        </>
                      )}
                    </span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
                    {c.bio}
                  </p>
                </div>
              </div>
              {said && (
                <blockquote
                  className="mt-3 border-l-2 pl-3"
                  style={{ borderColor: scenario.color }}
                >
                  <p className="font-serif text-sm italic leading-relaxed text-[color:var(--color-ink)]">
                    「{said}」
                  </p>
                </blockquote>
              )}
            </button>
          );
        })}
      </div>

      <PhaseLabel color={scenario.color}>
        現場検証
      </PhaseLabel>
      <p className="-mt-1 mb-3 text-[10px] tracking-[0.1em] text-[color:var(--color-ink-soft)]">
        手がかりを選んで調べる（{discovered.length}/{scenario.clues.length}）
      </p>
      <div className="space-y-2">
        {scenario.clues.map((clue) => {
          const found = discovered.includes(clue.id);
          return (
            <button
              key={clue.id}
              data-focusable
              onClick={() => onReveal(clue.id)}
              disabled={found}
              className={`w-full border p-4 text-left transition ${
                found
                  ? "border-[color:var(--color-line)]/60 bg-[color:var(--color-cream-soft)] cursor-default"
                  : "border-[color:var(--color-line)] bg-[color:var(--color-paper)] hover:border-[color:var(--color-ink)]/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin
                  size={13}
                  strokeWidth={1.5}
                  style={{ color: scenario.color }}
                />
                <span className="text-[10px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                  {clue.location}
                </span>
                <span className="ml-auto">
                  {found ? (
                    <Check size={14} strokeWidth={2} style={{ color: scenario.color }} />
                  ) : (
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className="text-[color:var(--color-ink-soft)]"
                    />
                  )}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-[color:var(--color-ink)]">
                {clue.title}
              </p>
              {found && (
                <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
                  {clue.text}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <button
        data-focusable
        onClick={onAccuse}
        disabled={!allFound}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] transition disabled:cursor-not-allowed"
        style={
          allFound
            ? { backgroundColor: scenario.color, color: "var(--color-paper)" }
            : {
                backgroundColor: "var(--color-cream-soft)",
                color: "var(--color-ink-soft)",
              }
        }
      >
        {allFound ? (
          <>
            推理して犯人を名指す
            <Gavel size={13} strokeWidth={1.75} />
          </>
        ) : (
          <>
            <Lock size={12} strokeWidth={1.5} />
            すべての手がかりを調べて
          </>
        )}
      </button>
    </div>
  );
}

function AccuseView({
  scenario,
  selected,
  onSelect,
  onBack,
  onAccuse,
}: {
  scenario: MMScenario;
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onAccuse: (id: string) => void;
}) {
  return (
    <div className="pt-6">
      <PhaseLabel color={scenario.color}>告発</PhaseLabel>
      <h2 className="font-serif text-[26px] leading-tight text-[color:var(--color-ink)]">
        犯人は誰だ？
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
        集めた手がかりと矛盾を頼りに、ひとりを選ぶ。選び直しはできる。
      </p>

      <div className="mt-5 space-y-2">
        {scenario.characters.map((c) => {
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              data-focusable
              onClick={() => onSelect(c.id)}
              className="flex w-full items-center gap-3 border p-4 text-left transition"
              style={
                active
                  ? { borderColor: scenario.color, backgroundColor: "var(--color-paper)" }
                  : { borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }
              }
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] tracking-widest text-[color:var(--color-paper)]"
                style={{ backgroundColor: scenario.color }}
              >
                {c.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[color:var(--color-ink)]">
                  {c.name}
                </p>
                <p className="text-[10px] tracking-[0.15em] text-[color:var(--color-ink-soft)]">
                  {c.role}
                </p>
              </div>
              {active && (
                <Check
                  size={16}
                  strokeWidth={2}
                  className="ml-auto"
                  style={{ color: scenario.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          data-focusable
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 border border-[color:var(--color-line)] px-5 py-3.5 text-[11px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition hover:text-[color:var(--color-ink)]"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          現場へ戻る
        </button>
        <button
          data-focusable
          onClick={() => selected && onAccuse(selected)}
          disabled={!selected}
          className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] transition disabled:cursor-not-allowed"
          style={
            selected
              ? { backgroundColor: scenario.color, color: "var(--color-paper)" }
              : {
                  backgroundColor: "var(--color-cream-soft)",
                  color: "var(--color-ink-soft)",
                }
          }
        >
          この人物を告発する
          <Gavel size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function ResultView({
  scenario,
  accused,
  correct,
  onRetry,
  onReset,
}: {
  scenario: MMScenario;
  accused: { name: string; role: string };
  correct: boolean;
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="pt-6">
      <PhaseLabel color={scenario.color}>
        {correct ? "解決" : "推理は外れた"}
      </PhaseLabel>
      <h2 className="font-serif text-[28px] leading-tight text-[color:var(--color-ink)]">
        {correct ? "事件は、解かれた。" : "まだ、真実は遠い。"}
      </h2>
      <p className="mt-2 text-xs text-[color:var(--color-ink-soft)]">
        あなたの告発：{accused.name}（{accused.role}）
      </p>

      <div className="mt-5 space-y-3 border-l-2 pl-4" style={{ borderColor: scenario.color }}>
        {(correct ? scenario.endings.correct : scenario.endings.wrong).map(
          (p, i) => (
            <p key={i} className="text-sm leading-relaxed text-[color:var(--color-ink)]">
              {p}
            </p>
          ),
        )}
      </div>

      {correct && (
        <div className="mt-6 bg-[color:var(--color-cream-soft)] border border-[color:var(--color-line)]/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            <FileText size={11} strokeWidth={1.5} />
            真相
          </p>
          <div className="space-y-2">
            {scenario.solution.explanation.map((p, i) => (
              <p key={i} className="text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {!correct && (
          <button
            data-focusable
            onClick={onRetry}
            className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] text-[color:var(--color-paper)] transition hover:opacity-90"
            style={{ backgroundColor: scenario.color }}
          >
            もう一度告発する
            <Gavel size={13} strokeWidth={1.75} />
          </button>
        )}
        <button
          data-focusable
          onClick={onReset}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] tracking-[0.25em] transition ${
            correct
              ? "flex-1 text-[color:var(--color-paper)] hover:opacity-90"
              : "border border-[color:var(--color-line)] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
          }`}
          style={correct ? { backgroundColor: scenario.color } : undefined}
        >
          <RotateCcw size={12} strokeWidth={1.5} />
          最初から
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/murder-mystery"
          className="text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-ink)]"
        >
          ほかの事件を見る
        </Link>
      </div>
    </div>
  );
}
