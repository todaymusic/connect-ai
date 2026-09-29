import type { Metadata } from "next";
import { CommunityListPage } from "@/components/pages/CommunityListPage";

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "자유·익명·Q&A·연주 자랑·음악창업 고민방. 음악하는 사람들의 이야기.",
  alternates: { canonical: "/community" },
};

export default async function CommunityPage({ searchParams }: PageProps<"/community">) {
  return <CommunityListPage searchParams={await searchParams} />;
}
