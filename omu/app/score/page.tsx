import type { Metadata } from "next";
import { ScoreList } from "@/components/pages/ScoreList";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

const title = "무료 악보 공유";
const description = "피아노·기타·보컬·드럼·베이스·밴드스코어·코드표까지, 과목별 무료 악보를 찾아보세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/score" },
  openGraph: {
    title,
    description,
    url: "/score",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "OMU 무료 악보 공유" }],
  },
  twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
};

export default async function ScorePage({ searchParams }: PageProps<"/score">) {
  return <ScoreList searchParams={await searchParams} />;
}
