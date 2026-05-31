import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Member } from "@/lib/types";

function rowToMember(row: Record<string, unknown>): Member {
  return {
    name: row.name as string,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    groupName: (row.group_name as string | null) ?? undefined,
  };
}

/**
 * Raw members list. Cached cross-request via the Data Cache (a plain array is
 * serializable; a Map is built outside the cache by getMemberMap).
 */
const fetchMembers = unstable_cache(
  async (): Promise<Member[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase.from("members").select("*");
    if (error) throw error;
    return (data ?? []).map(rowToMember);
  },
  ["members"],
  { revalidate: 60, tags: ["members"] },
);

/** All members, keyed by name for fast avatar lookups. Cached per request. */
export const getMemberMap = cache(async (): Promise<Map<string, Member>> => {
  const members = await fetchMembers();
  return new Map(members.map((m) => [m.name, m]));
});
