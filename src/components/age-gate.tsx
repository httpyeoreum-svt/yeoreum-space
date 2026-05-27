import { Lock } from "lucide-react";
import { unlockAgeGate } from "@/lib/actions/age";

/**
 * Full-page gate shown when an item has `ageLimit` but the visitor hasn't
 * unlocked age-restricted content. Form submission calls the server action
 * which sets the cookie and revalidates the page so the item appears.
 */
export function AgeGate({ redirectPath }: { redirectPath?: string }) {
  async function reveal() {
    "use server";
    await unlockAgeGate(redirectPath);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-full border border-[color:var(--color-line)] flex items-center justify-center">
          <Lock size={18} strokeWidth={1.5} className="text-[color:var(--color-ink)]" />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
            AGE RESTRICTED
          </p>
          <h1 className="font-serif text-[28px] leading-tight text-[color:var(--color-ink)]">
            This work contains mature content.
          </h1>
          <p className="mt-3 text-[12px] text-[color:var(--color-ink-muted)] leading-relaxed">
            By continuing you confirm you are old enough to view it. The unlock lasts until midnight.
          </p>
        </div>
        <form action={reveal} className="flex flex-col items-center gap-3 mt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[color:var(--color-ink)] text-white px-5 py-2.5 text-[10px] tracking-[0.3em] hover:opacity-90 transition"
          >
            REVEAL
          </button>
          <a
            href="/"
            className="text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
          >
            BACK TO COLLECTION
          </a>
        </form>
      </div>
    </div>
  );
}
