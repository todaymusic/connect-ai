import Link from "next/link";
import { FileMusic } from "lucide-react";
import { ScoreCard } from "@/components/cards/ScoreCard";
import { CategoryTabs, ChipFilter, ComingSoonState, EmptyState, FilterForm, ListHeader, ListShell, Pagination, ResultCount } from "@/components/list/ListLayout";
import { listScores } from "@/lib/data/scores";
import { DIFFICULTIES, SCORE_GENRES, SCORE_INSTRUMENTS, type ScoreInstrument } from "@/lib/site";
import { first, pageParam, pick, type Query, type SearchParams } from "@/lib/url";

const SORTS = { latest: "최신순", popular: "인기순" } as const;

export async function ScoreList({ instrument, searchParams }: { instrument?: ScoreInstrument; searchParams: SearchParams }) {
  const pathname = instrument ? `/score/${instrument}` : "/score";
  const difficulty = pick(searchParams.difficulty, DIFFICULTIES);
  const genre = pick(searchParams.genre, SCORE_GENRES);
  const sort = pick(searchParams.sort, SORTS);
  const q = first(searchParams.q);
  const page = pageParam(searchParams.page);
  const query: Query = { difficulty, genre, sort, q, page: page > 1 ? String(page) : undefined };

  const result = await listScores({ instrument, difficulty, genre, q, sort: sort ?? "latest", page });
  const title = instrument ? `${SCORE_INSTRUMENTS[instrument]} 악보` : "악보공유";
  // 등록된 악보가 하나도 없으면 '검색 결과 없음' 대신 중립 안내 (필터는 숨김) — 악보가 1개라도 생기면 자동으로 정상 목록
  const comingSoon = result.total === 0 && (await listScores({ pageSize: 1 })).total === 0;

  return (
    <ListShell>
      <ListHeader
        eyebrow="Free Scores"
        title={title}
        description={
          comingSoon
            ? "과목별 무료 악보를 모아 두는 곳이에요. 원하는 곡이 있으면 악보를 요청할 수 있어요."
            : "에디터가 정리한 무료 악보를 과목별로 찾아보세요. 원하는 곡이 없으면 악보를 요청할 수 있어요."
        }
        writeHref="/write/score-request"
        writeLabel="악보 요청"
      />
      <CategoryTabs
        label="과목"
        current={instrument ?? "all"}
        items={[
          { key: "all", href: "/score", label: "전체" },
          ...(Object.keys(SCORE_INSTRUMENTS) as ScoreInstrument[]).map((k) => ({ key: k, href: `/score/${k}`, label: SCORE_INSTRUMENTS[k] })),
          { key: "requests", href: "/score/requests", label: "악보 요청" },
        ]}
      />

      {comingSoon ? (
        <div className="mt-6">
          <ComingSoonState title="아직 등록된 악보가 없어요" icon={FileMusic} action={{ href: "/score/requests", label: "악보 요청 보기" }}>
            찾는 곡이 있다면 악보 요청을 남겨 주세요.
          </ComingSoonState>
        </div>
      ) : (
      <>
      <div className="mt-5 space-y-3 rounded-2xl border border-line bg-card p-3 sm:p-4">
        <FilterForm
          pathname={pathname}
          query={query}
          placeholder="곡명·작곡가로 찾기"
          selects={[{ name: "genre", label: "장르", options: SCORE_GENRES.map((g) => ({ value: g, label: g })) }]}
          keep={["difficulty", "sort"]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ChipFilter
            label="난이도"
            param="difficulty"
            current={difficulty}
            pathname={pathname}
            query={query}
            options={Object.entries(DIFFICULTIES).map(([value, label]) => ({ value, label }))}
          />
          <ChipFilter
            label="정렬"
            param="sort"
            current={sort}
            pathname={pathname}
            query={query}
            allLabel="최신순"
            options={[{ value: "popular", label: SORTS.popular }]}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <ResultCount total={result.total} query={q} />
      </div>

      {result.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="조건에 맞는 악보가 없어요">
            필터를 바꾸거나{" "}
            <Link href="/write/score-request" className="font-semibold text-blue hover:underline">
              악보를 요청
            </Link>
            해 주세요.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {result.items.map((s) => (
            <li key={s.id}>
              <ScoreCard score={s} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} pathname={pathname} query={query} />
      </>
      )}
    </ListShell>
  );
}
