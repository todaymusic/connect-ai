import { RecruitCard } from "@/components/cards/RecruitCard";
import { CategoryTabs, ChipFilter, ComingSoonState, EmptyState, FilterForm, ListHeader, ListShell, Pagination, ResultCount } from "@/components/list/ListLayout";
import { Users } from "lucide-react";
import { closedReason } from "@/lib/write/config";
import { LevelBadge } from "@/components/ui";
import { listRecruits } from "@/lib/data/recruits";
import { RECRUIT_CATEGORIES, RECRUIT_LEVELS, REGIONS, type RecruitCategory, type RecruitLevel } from "@/lib/site";
import { first, pageParam, pick, type Query, type SearchParams } from "@/lib/url";

export async function RecruitListPage({ category, searchParams }: { category?: RecruitCategory; searchParams: SearchParams }) {
  const pathname = category ? `/recruit/${category}` : "/recruit";
  // 성격 배지(취미/세미프로/현역)는 밴드 모집에서만 의미가 있다
  const showLevel = !category || category === "band";
  const level = showLevel ? pick(searchParams.level, RECRUIT_LEVELS) : undefined;
  const region = pick(searchParams.region, REGIONS);
  const open = first(searchParams.open) === "1" ? "1" : undefined;
  const q = first(searchParams.q);
  const page = pageParam(searchParams.page);
  const query: Query = { level, region, open, q, page: page > 1 ? String(page) : undefined };
  const result = await listRecruits({ category, level, region, openOnly: Boolean(open), q, page });
  // 모집글이 하나도 없으면 '검색 결과 없음' 대신 준비 중 안내 (필터는 숨김)
  const empty = result.total === 0 && (await listRecruits({ pageSize: 1 })).total === 0;
  const closed = closedReason("recruit");

  return (
    <ListShell>
      <ListHeader
        eyebrow="Recruit"
        title={category ? RECRUIT_CATEGORIES[category] : "구인·모집"}
        description={empty ? "밴드 멤버, 세션·외주, 강사·레슨, 공고·오디션 게시판을 준비하고 있어요." : "밴드 멤버, 세션·외주, 강사·레슨, 공고·오디션까지. 성격 배지로 나에게 맞는 팀을 찾아보세요."}
        writeHref={closed ? undefined : `/write/recruit${category ? `?category=${category}` : ""}`}
        writeLabel="모집글 쓰기"
      />
      <CategoryTabs
        label="모집 분류"
        current={category ?? "all"}
        items={[
          { key: "all", href: "/recruit", label: "전체" },
          ...(Object.keys(RECRUIT_CATEGORIES) as RecruitCategory[]).map((k) => ({ key: k, href: `/recruit/${k}`, label: RECRUIT_CATEGORIES[k] })),
        ]}
      />
      {empty ? (
        <div className="mt-6">
          {closed ? (
            <ComingSoonState title="구인·모집은 준비 중이에요" action={{ href: "/community", label: "커뮤니티 둘러보기" }}>
              곧 밴드·세션 모집글을 올릴 수 있게 열 예정이에요. 그전까지는 커뮤니티에서 이야기를 나눠 보세요.
            </ComingSoonState>
          ) : (
            <ComingSoonState title="아직 올라온 모집글이 없어요" icon={Users} action={{ href: `/write/recruit${category ? `?category=${category}` : ""}`, label: "첫 모집글 쓰기" }}>
              밴드 멤버·세션·강사·오디션 모집글을 올릴 수 있어요.
            </ComingSoonState>
          )}
        </div>
      ) : (
      <>
      <div className="mt-5 space-y-3 rounded-2xl border border-line bg-card p-3 sm:p-4">
        <FilterForm
          pathname={pathname}
          query={query}
          placeholder="제목·파트·장르로 찾기"
          selects={[{ name: "region", label: "지역", options: REGIONS.map((r) => ({ value: r, label: r })) }]}
          keep={["level", "open"]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {showLevel ? (
            <ChipFilter
              label="성격"
              param="level"
              current={level}
              pathname={pathname}
              query={query}
              options={(Object.keys(RECRUIT_LEVELS) as RecruitLevel[]).map((l) => ({ value: l, label: <LevelBadge level={l} /> }))}
            />
          ) : (
            <span />
          )}
          <ChipFilter
            label="마감"
            param="open"
            current={open}
            pathname={pathname}
            query={query}
            allLabel="전체 보기"
            options={[{ value: "1", label: "모집 중만" }]}
          />
        </div>
      </div>
      <div className="mt-6">
        <ResultCount total={result.total} query={q} />
      </div>
      {result.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="조건에 맞는 모집글이 없어요">지역이나 성격을 바꿔 보거나, 직접 모집글을 올려 보세요.</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
          {result.items.map((r) => (
            <li key={r.id}>
              <RecruitCard recruit={r} showCategory={!category} />
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
