import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityListPage } from "@/components/pages/CommunityListPage";
import { COMMUNITY_CATEGORIES, isKey } from "@/lib/site";

export function generateStaticParams() {
  return Object.keys(COMMUNITY_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/community/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isKey(COMMUNITY_CATEGORIES, category)) return {};
  return {
    title: `${COMMUNITY_CATEGORIES[category]} — 커뮤니티`,
    description: `OMU 커뮤니티 ${COMMUNITY_CATEGORIES[category]} 게시판.`,
    alternates: { canonical: `/community/${category}` },
    // 익명 게시판 목록은 검색 노출하지 않는다
    robots: category === "anon" ? { index: false, follow: true } : undefined,
  };
}

export default async function CommunityCategoryPage({ params, searchParams }: PageProps<"/community/[category]">) {
  const { category } = await params;
  if (!isKey(COMMUNITY_CATEGORIES, category)) notFound();
  return <CommunityListPage category={category} searchParams={await searchParams} />;
}
