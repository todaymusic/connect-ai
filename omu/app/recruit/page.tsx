import type { Metadata } from "next";
import { RecruitListPage } from "@/components/pages/RecruitListPage";

export const metadata: Metadata = {
  title: "구인·모집 — 밴드 멤버·세션·레슨·오디션",
  description: "밴드·팀원 모집, 세션·외주, 강사·레슨, 공고·공모전·오디션을 한곳에서.",
  alternates: { canonical: "/recruit" },
};

export default async function RecruitPage({ searchParams }: PageProps<"/recruit">) {
  return <RecruitListPage searchParams={await searchParams} />;
}
