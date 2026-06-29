import { NightTrainGame } from "@/components/night-train/game";

export const metadata = {
  title: "23:30 — Night Train Mystery",
  description: "停車した寝台列車で起きた車掌殺害事件。聞き込みと証拠で真犯人を追う探索型マダミス。",
};

export default function NightTrainPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none">
      <NightTrainGame />
    </div>
  );
}
