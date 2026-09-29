import { notFound } from "next/navigation";
import { ArticleDetail, articleMetadata } from "@/components/pages/ArticleDetail";
import { getArticle, listArticles } from "@/lib/data/articles";
import { INFO_CATEGORIES, isKey, type InfoCategory } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const { items } = await listArticles({ categories: Object.keys(INFO_CATEGORIES) as InfoCategory[], pageSize: 500 });
  return items.map((a) => ({ category: a.category, slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[category]/[slug]">) {
  const { category, slug } = await params;
  return articleMetadata(category, slug);
}

export default async function InfoArticlePage({ params }: PageProps<"/info/[category]/[slug]">) {
  const { category, slug } = await params;
  if (!isKey(INFO_CATEGORIES, category)) notFound();
  const article = await getArticle(category, slug);
  if (!article) notFound();
  return <ArticleDetail article={article} />;
}
