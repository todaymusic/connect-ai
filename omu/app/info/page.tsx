import type { Metadata } from "next";
import { ArticleList } from "@/components/pages/ArticleList";

export const metadata: Metadata = {
  title: "음악정보",
  description: "악기 입문, 실용음악 입시, 공연·공모전, 연습실·대관 정보와 뮤직스토리.",
  alternates: { canonical: "/info" },
};

export default async function InfoPage({ searchParams }: PageProps<"/info">) {
  return <ArticleList section="info" searchParams={await searchParams} />;
}
