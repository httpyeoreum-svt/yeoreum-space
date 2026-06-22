import { RecentNovels } from "@/components/recent-novels";
import { MoodBar } from "@/components/mood-bar";
import { CategoryGrid } from "@/components/category-grid";
import { getGridItems } from "@/lib/db/items";
import { getPublishedNovels } from "@/lib/db/novels";
import { getCategoryCounts } from "@/lib/db/category-counts";
import { isAgeVerified } from "@/lib/age-verify";

export default async function Home() {
  const [novels, grid, counts, ageVerified] = await Promise.all([
    getPublishedNovels(),
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
        <div
          className="home-hero relative flex h-[28vh] w-full shrink-0 items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: "url(/background.avif)" }}
        >
          <h1 className="font-script text-center leading-[0.85] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
            <span className="block text-[clamp(2.75rem,9vw,5.5rem)]">Yeoreum</span>
            <span className="block text-[clamp(2.75rem,9vw,5.5rem)]">Space</span>
          </h1>
          <p className="absolute inset-x-0 bottom-0 px-6 pb-8 text-center font-serif text-[10px] italic leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:text-[11px]">
            The end of the secret quagmire is a new beginning
            <br />
            Close our eyes and when we grow closer, make it even hotter, light a flame in your heart
          </p>
        </div>
        <div className="relative z-10 -mt-5 rounded-t-[1.5rem] bg-[color:var(--color-cream)] pt-1">
          <RecentNovels novels={novels} />
          <MoodBar />
          <CategoryGrid items={grid} counts={counts} ageVerified={ageVerified} />
        </div>
      </div>
    </>
  );
}
