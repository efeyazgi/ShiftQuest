import type { Metadata } from "next";
import { getScenarioById } from "@/data/scenarios";
import { ScenarioPlayer } from "@/components/scenario/scenario-player";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const scenario = getScenarioById(id);
  return { title: scenario?.title ?? "Mission" };
}

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScenarioPlayer scenarioId={id} />;
}
