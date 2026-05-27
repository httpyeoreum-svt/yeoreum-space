import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

function rowToMember(row: Record<string, unknown>): Member {
  return {
    name: row.name as string,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    groupName: (row.group_name as string | null) ?? undefined,
  };
}

/** All members, keyed by name for fast avatar lookups. Cached per request. */
export const getMemberMap = cache(async (): Promise<Map<string, Member>> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("members").select("*");
  if (error) throw error;
  const map = new Map<string, Member>();
  for (const row of data ?? []) {
    const m = rowToMember(row);
    map.set(m.name, m);
  }
  return map;
});
