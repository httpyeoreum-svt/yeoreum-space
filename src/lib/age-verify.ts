import { cookies } from "next/headers";

const COOKIE_NAME = "yeoreum_age_ok";

/** Returns true if the viewer has unlocked age-restricted content today. */
export async function isAgeVerified(): Promise<boolean> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value === "1";
}

/** Seconds remaining until end of today (UTC). Used as the cookie Max-Age. */
function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return Math.max(60, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

/** Set the verified cookie. Expires at next UTC midnight. */
export async function setAgeVerifiedCookie(): Promise<void> {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: "1",
    path: "/",
    maxAge: secondsUntilMidnightUTC(),
    sameSite: "lax",
  });
}

/** Clear the verified cookie (debug / explicit relock). */
export async function clearAgeVerifiedCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
