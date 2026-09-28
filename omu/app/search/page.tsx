import Link from "next/link";
import type { Metadata } from "next";
import { SearchForm } from "@/components/SearchForm";
import { Badge, Section } from "@/components/ui";
import { MOCK_ARTICLES, MOCK_MARKET, MOCK_POPULAR, MOCK_QNA, MOCK_RECRUITS, MOCK_SCORES } from "@/lib/mock";
import { ARTICLE_CATEGORIES, COMMUNITY_CATEGORIES, RECRUIT_CATEGORIES, SCORE_INSTRUMENTS, articlePath } from "@/lib/site";

export const metadata: Metadata = {
  title: "통합 검색",
  robots: { index: false, follow: true },
};

type Hit = { href: string; title: string; group: string; meta: string };

// 1차: 목데이터 제목 부분일치 검색 (DB 연동 시 각 테이블 title ILIKE 검색으로 교체)
function searchMock(q: string): Hit[] {
  const needle = q.toLowerCase();
  const has = (...fields: (string | undefined)[]) => fields.some((f) => f?.toLowerCase().includes(needle));
  return [
    ...MOCK_SCORES.filter((s) => has(s.title, s.artist, SCORE_INSTRUMENTS[s.instrument])).map((s) => ({
      href: `/score/${s.instrument}/${s.slug}`,
      title: s.title,
      group: "악보",
      meta: `${SCORE_INSTRUMENTS[s.instrument]} · ${s.artist}`,
    })),
    ...MOCK_ARTICLES.filter((a) => has(a.title, a.summary)).map((a) => ({
      href: articlePath(a.category, a.slug),
      title: a.title,
      group: "음악정보",
      meta: ARTICLE_CATEGORIES[a.category],
    })),
    ...MOCK_MARKET.filter((m) => has(m.title)).map((m) => ({
      href: `/gear/market/${m.id}`,
      title: m.title,
      group: "중고",
      meta: `${m.region} · ${m.timeAgo}`,
    })),
    ...MOCK_RECRUITS.filter((r) => has(r.title, r.genre, ...r.positions)).map((r) => ({
      href: `/recruit/${r.category}/${r.id}`,
      title: r.title,
      group: "구인",
      meta: `${RECRUIT_CATEGORIES[r.category]} · ${r.region}`,
    })),
    ...[...MOCK_QNA, ...MOCK_POPULAR].filter((p) => has(p.title)).map((p) => ({
      href: `/community/${p.category}/${p.id}`,
      title: p.title,
      group: "커뮤니티",
      meta: COMMUNITY_CATEGORIES[p.category],
    })),
  ];
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const hits = query ? searchMock(query) : [];

  return (
    <Section className="py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">통합 검색</h1>
      <SearchForm size="lg" defaultValue={query} className="mt-5 max-w-[640px]" autoFocus={!query} />

      {query ? (
        <div className="mt-8">
          <p className="text-sm text-ink-2">
            <strong className="text-ink">‘{query}’</strong> 검색 결과 <span className="font-display">{hits.length}</span>건
          </p>
          {hits.length > 0 ? (
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
              {hits.map((h) => (
                <li key={h.href}>
                  <Link href={h.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper">
                    <Badge className="w-16 justify-center">{h.group}</Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{h.title}</span>
                      <span className="block truncate text-xs text-ink-3">{h.meta}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-line-2 px-4 py-10 text-center text-sm text-ink-2">
              검색 결과가 없어요. 다른 곡명이나 악기 이름으로 찾아보세요.
              <br />
              원하는 악보가 없다면{" "}
              <Link href="/score/requests" className="font-semibold text-blue hover:underline">
                악보 요청
              </Link>
              을 남겨주세요.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-3">곡명, 악기, 아티스트로 악보·정보글·중고·구인·커뮤니티를 한 번에 찾아요.</p>
      )}
    </Section>
  );
}
