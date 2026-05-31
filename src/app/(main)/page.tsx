import { RecentlyAdded } from "@/components/recently-added";
import { MoodBar } from "@/components/mood-bar";
import { CategoryGrid } from "@/components/category-grid";
import { getRecentItems, getGridItems } from "@/lib/db/items";
import { getCategoryCounts } from "@/lib/db/category-counts";
import { isAgeVerified } from "@/lib/age-verify";

export default async function Home() {
  const [recent, grid, counts, ageVerified] = await Promise.all([
    getRecentItems(13),
    getGridItems(6, 8),
    getCategoryCounts(),
    isAgeVerified(),
  ]);
  return (
    <>
      {/* 背景画像は一旦オフ。戻すときは下のコメントを解除。
      <img
        src="/home-bg.webp"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="fixed bottom-0 left-0 lg:left-[260px] z-0 pointer-events-none h-lvh w-auto select-none will-change-transform opacity-60"
      /> */}
      <div className="relative z-10">
        <RecentlyAdded items={recent} />
        <MoodBar />
        <CategoryGrid items={grid} counts={counts} ageVerified={ageVerified} />
      </div>
    </>
  );
}
