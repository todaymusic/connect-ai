import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecruitListPage } from "@/components/pages/RecruitListPage";
import { RECRUIT_CATEGORIES, isKey } from "@/lib/site";

export function generateStaticParams() {
  return Object.keys(RECRUIT_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/recruit/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isKey(RECRUIT_CATEGORIES, category)) return {};
  return {
    title: `${RECRUIT_CATEGORIES[category]} — 구인·모집`,
    description: `${RECRUIT_CATEGORIES[category]} 글 모음. 지역·성격별로 찾아보세요.`,
    alternates: { canonical: `/recruit/${category}` },
  };
}

export default async function RecruitCategoryPage({ params, searchParams }: PageProps<"/recruit/[category]">) {
  const { category } = await params;
  if (!isKey(RECRUIT_CATEGORIES, category)) notFound();
  return <RecruitListPage category={category} searchParams={await searchParams} />;
}
