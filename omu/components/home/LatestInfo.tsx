import type { Article } from "@/lib/data/types";
import { ArticleCard } from "../cards/ArticleCard";

export function LatestInfo({ articles }: { articles: Article[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {articles.map((a) => (
        <li key={a.id}>
          <ArticleCard article={a} />
        </li>
      ))}
    </ul>
  );
}
