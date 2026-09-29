import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreList } from "@/components/pages/ScoreList";
import { SCORE_INSTRUMENTS, isKey } from "@/lib/site";

export function generateStaticParams() {
  return Object.keys(SCORE_INSTRUMENTS).map((instrument) => ({ instrument }));
}

export async function generateMetadata({ params }: PageProps<"/score/[instrument]">): Promise<Metadata> {
  const { instrument } = await params;
  if (!isKey(SCORE_INSTRUMENTS, instrument)) return {};
  const label = SCORE_INSTRUMENTS[instrument];
  return {
    title: `${label} 무료 악보`,
    description: `${label} 무료 악보 모음. 난이도·장르별로 골라 바로 확인하세요.`,
    alternates: { canonical: `/score/${instrument}` },
  };
}

export default async function ScoreInstrumentPage({ params, searchParams }: PageProps<"/score/[instrument]">) {
  const { instrument } = await params;
  if (!isKey(SCORE_INSTRUMENTS, instrument)) notFound();
  return <ScoreList instrument={instrument} searchParams={await searchParams} />;
}
