import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreList } from "@/components/pages/ScoreList";
import { DEFAULT_OG_IMAGE, SCORE_INSTRUMENTS, isKey } from "@/lib/site";

export function generateStaticParams() {
  return Object.keys(SCORE_INSTRUMENTS).map((instrument) => ({ instrument }));
}

export async function generateMetadata({ params }: PageProps<"/score/[instrument]">): Promise<Metadata> {
  const { instrument } = await params;
  if (!isKey(SCORE_INSTRUMENTS, instrument)) return {};
  const label = SCORE_INSTRUMENTS[instrument];
  const title = `${label} 무료 악보`;
  const description = `${label} 무료 악보 모음. 난이도·장르별로 골라 바로 확인하세요.`;
  const url = `/score/${instrument}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${label} 무료 악보 | OMU` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export default async function ScoreInstrumentPage({ params, searchParams }: PageProps<"/score/[instrument]">) {
  const { instrument } = await params;
  if (!isKey(SCORE_INSTRUMENTS, instrument)) notFound();
  return <ScoreList instrument={instrument} searchParams={await searchParams} />;
}
