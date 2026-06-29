import { notFound } from "next/navigation";
import { SCENARIOS, getScenario } from "@/lib/murder-mystery";
import { GamePlayer } from "@/components/murder-mystery/game-player";

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenario(decodeURIComponent(id));
  if (!scenario) return {};
  return {
    title: `${scenario.title} — Murder Mystery`,
    description: scenario.tagline,
  };
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenario(decodeURIComponent(id));
  if (!scenario) notFound();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none">
      <GamePlayer scenario={scenario} />
    </div>
  );
}
