import type { Metadata } from "next";
import { ScoreList } from "@/components/pages/ScoreList";

export const metadata: Metadata = {
  title: "무료 악보 공유",
  description: "피아노·기타·보컬·드럼·베이스·밴드스코어·코드표까지, 과목별 무료 악보를 찾아보세요.",
  alternates: { canonical: "/score" },
};

export default async function ScorePage({ searchParams }: PageProps<"/score">) {
  return <ScoreList searchParams={await searchParams} />;
}
