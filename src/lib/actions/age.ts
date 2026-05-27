"use server";

import { revalidatePath } from "next/cache";
import { setAgeVerifiedCookie } from "@/lib/age-verify";

/**
 * Unlock age-restricted content for the rest of the day. Returns to the
 * caller's URL so the just-unblurred item appears immediately.
 */
export async function unlockAgeGate(redirectPath?: string): Promise<void> {
  await setAgeVerifiedCookie();
  // Re-render all routes so blurred lists update too.
  revalidatePath("/", "layout");
  if (redirectPath) revalidatePath(redirectPath);
}
