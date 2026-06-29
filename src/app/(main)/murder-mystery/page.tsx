import Link from "next/link";
import { ArrowRight, TrainFront } from "lucide-react";
import { SCENARIOS, DIFFICULTY_LABEL } from "@/lib/murder-mystery";
import { NIGHT_TRAIN } from "@/lib/night-train";

export const metadata = {
  title: "Murder Mystery — yeoreum space",
  description: "ブラウザ上で遊べる、ひとり用のマーダーミステリー。",
};

export default function MurderMysteryPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-3">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          MURDER MYSTERY
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          Solve it yourself.
        </h1>
        <p className="mt-3 max-w-xs sm:max-w-md text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
          ブラウザだけで遊べる、ひとり用のマーダーミステリー。痕跡を集め、矛盾を見つけ、犯人を名指しする。準備はいい？
        </p>
      </header>

      {/* 看板作：探索型マダミス */}
      <div className="px-6 pt-2">
        <Link
          href="/murder-mystery/night-train"
          className="group relative block overflow-hidden border border-[color:var(--color-ink)]/30 bg-[color:var(--color-paper)] transition hover:border-[color:var(--color-ink)]/60"
        >
          <div className="h-1.5 w-full" style={{ backgroundColor: NIGHT_TRAIN.color }} />
          <div className="p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-2 text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
              <TrainFront size={12} strokeWidth={1.5} />
              <span>FEATURED · 探索型</span>
              <span>·</span>
              <span>{NIGHT_TRAIN.players}</span>
              <span>·</span>
              <span>{NIGHT_TRAIN.duration}</span>
            </div>
            <h2 className="font-serif text-[26px] leading-tight text-[color:var(--color-ink)] sm:text-[30px]">
              {NIGHT_TRAIN.title}
            </h2>
            <p className="mt-3 max-w-md whitespace-pre-line text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
              {NIGHT_TRAIN.tagline}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition group-hover:text-[color:var(--color-ink)]">
              捜査を始める
              <ArrowRight size={12} strokeWidth={1.5} className="transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </div>

      <p className="px-6 pt-8 pb-1 text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
        SHORT CASES
      </p>
      <div className="grid grid-cols-1 gap-4 px-6 pb-12 pt-2 sm:grid-cols-2">
        {SCENARIOS.map((s) => (
          <Link
            key={s.id}
            href={`/murder-mystery/${s.id}`}
            className="group relative flex flex-col overflow-hidden border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] transition hover:border-[color:var(--color-ink)]/40"
          >
            <div
              className="h-1.5 w-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-center gap-2 text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
                <span>{s.players}</span>
                <span>·</span>
                <span>{s.duration}</span>
                <span>·</span>
                <span style={{ color: s.color }} className="font-medium">
                  {DIFFICULTY_LABEL[s.difficulty]}
                </span>
              </div>
              <h2 className="font-serif text-[24px] leading-tight text-[color:var(--color-ink)]">
                {s.title}
              </h2>
              {s.reading && (
                <p className="mt-0.5 text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                  {s.reading}
                </p>
              )}
              <p className="mt-3 flex-1 text-xs leading-relaxed text-[color:var(--color-ink-muted)]">
                {s.tagline}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] transition group-hover:text-[color:var(--color-ink)]">
                プレイする
                <ArrowRight
                  size={12}
                  strokeWidth={1.5}
                  className="transition group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
