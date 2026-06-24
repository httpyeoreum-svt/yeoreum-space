"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * First-visit intro splash.
 *
 * Visibility is driven entirely by React state (not a class on <html>, which
 * React can strip during hydration). Nothing renders on the server, so there is
 * no hydration mismatch. On mount we check localStorage: returning visitors
 * render nothing (no flash); first-time visitors get the overlay, dismissed by
 * Enter / Space / click / tap.
 */
const STORAGE_KEY = "yeoreum:intro-seen";
const FADE_MS = 650;

export function IntroOverlay() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Always show the intro on every visit.
    setShow(true);
  }, []);

  // Lock page scroll only while the overlay is shown. Cleanup guarantees the
  // lock is released even if the component unmounts (HMR / navigation) without
  // a dismiss — otherwise `html` stays overflow:hidden and the page (esp. once
  // DevTools narrows the viewport out of the app-shell mode) can't scroll.
  useEffect(() => {
    if (!show) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  const dismiss = useCallback(() => {
    setLeaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode — fine, shows again next load */
    }
    window.setTimeout(() => {
      setShow(false);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <div
      className="intro-overlay"
      style={leaving ? { opacity: 0 } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/intro.avif" alt="" aria-hidden className="intro-img" />
      <div className="relative z-10 mx-5 mt-[16vh] flex max-w-[31rem] flex-col items-center gap-7">
        <div className="space-y-3.5 text-center text-[9px] sm:text-[10px] leading-[1.9] tracking-[0.05em] text-[color:var(--color-cream)]/85">
          <p>
            サイト内記載の文章につきまして、全てフィクションであり、
            <br />
            実在の人物・関係者・所属事務所等とは一切関係ありません。
          </p>
          <p>公共の場での閲覧、URLの拡散、関係者への共有はご遠慮ください。</p>
          <p>無断転載・複製・AI学習への利用を禁止します。</p>
          <p className="pt-1 text-[color:var(--color-cream)] tracking-[0.08em]">
            上記をご理解いただける方のみご入場ください。
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="intro-prompt inline-flex cursor-pointer items-center gap-2 bg-[color:var(--color-ink)]/72 text-[color:var(--color-cream)] px-6 py-2 font-serif text-[13px] tracking-[0.12em] backdrop-blur-sm"
        >
          ENTER
        </button>
      </div>
    </div>
  );
}
