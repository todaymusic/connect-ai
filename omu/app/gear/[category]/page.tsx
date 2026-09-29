import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/pages/ArticleList";
import { GEAR_ARTICLE_CATEGORIES, isKey } from "@/lib/site";

// /gear/market 은 별도 폴더(중고 장터)가 먼저 잡는다. 여기는 장비·악기 정보글 분류만.
export function generateStaticParams() {
  return Object.keys(GEAR_ARTICLE_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/gear/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isKey(GEAR_ARTICLE_CATEGORIES, category)) return {};
  return {
    title: `${GEAR_ARTICLE_CATEGORIES[category]} — 악기`,
    description: `${GEAR_ARTICLE_CATEGORIES[category]} 글 모음.`,
    alternates: { canonical: `/gear/${category}` },
  };
}

export default async function GearCategoryPage({ params, searchParams }: PageProps<"/gear/[category]">) {
  const { category } = await params;
  if (!isKey(GEAR_ARTICLE_CATEGORIES, category)) notFound();
  return <ArticleList section="gear" category={category} searchParams={await searchParams} />;
}
