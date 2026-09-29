import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/pages/ArticleList";
import { INFO_CATEGORIES, isKey } from "@/lib/site";

export function generateStaticParams() {
  return Object.keys(INFO_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/info/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isKey(INFO_CATEGORIES, category)) return {};
  return {
    title: `${INFO_CATEGORIES[category]} — 음악정보`,
    description: `${INFO_CATEGORIES[category]} 관련 정보글 모음.`,
    alternates: { canonical: `/info/${category}` },
  };
}

export default async function InfoCategoryPage({ params, searchParams }: PageProps<"/info/[category]">) {
  const { category } = await params;
  if (!isKey(INFO_CATEGORIES, category)) notFound();
  return <ArticleList section="info" category={category} searchParams={await searchParams} />;
}
