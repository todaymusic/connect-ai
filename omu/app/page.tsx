import { CategoryShortcuts } from "@/components/home/CategoryShortcuts";
import { CommunityBoards } from "@/components/home/CommunityBoards";
import { ComingSoonCard, FirstPostCard } from "@/components/home/ComingSoonCard";
import { FreeScoreTabs } from "@/components/home/FreeScores";
import { Hero } from "@/components/home/Hero";
import { HowOmuWorks } from "@/components/home/HowOmuWorks";
import { JoinBanner } from "@/components/home/JoinBanner";
import { LatestInfo } from "@/components/home/LatestInfo";
import { MarketPreview } from "@/components/home/MarketPreview";
import { NewsStrip } from "@/components/home/NewsStrip";
import { RecruitLegend, RecruitList } from "@/components/home/RecruitList";
import { Section, SectionHeader } from "@/components/ui";
import { POPULAR_KEYWORDS, getHomeData } from "@/lib/data/home";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { closedReason } from "@/lib/write/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// 5분마다 다시 만든다 (Supabase 연결 후 새 글이 홈에 반영되도록)
export const revalidate = 300;

// 홈 섹션 순서는 작업지시서 9-2 (검색 → 배너 → 무료 악보 → 정보 → 중고 → 커뮤니티 → 구인)
export default async function HomePage() {
  const home = await getHomeData();
  // 모두 실제 데이터 건수로 계산 — 글이 1건이라도 생기면 자동으로 '이용 가능'·정상 목록으로 바뀐다(하드코딩 금지)
  //  · 악보·음악정보: 비어 있으면 섹션을 통째로 숨긴다('준비 중' 문구 없음)
  //  · 장터·구인: 0건일 때만 '준비 중' 안내
  const open = {
    info: home.totals.articles > 0,
    scores: home.totals.scores > 0,
    market: home.totals.market > 0,
    recruit: home.totals.recruits > 0,
  };
  const hasPosts = home.totals.posts > 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero
        stats={home.stats}
        keywords={POPULAR_KEYWORDS}
        // 히어로 목록: 데이터가 있거나 글쓰기가 열려 있으면 '이용 가능', 둘 다 아니면 '준비 중'
        open={{ ...open, market: open.market || !closedReason("market"), recruit: open.recruit || !closedReason("recruit") }}
      />
      <NewsStrip />

      <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-20">
        <CategoryShortcuts />

        {open.scores && (
          <Section labelledBy="free-scores-title">
            <SectionHeader
              id="free-scores-title"
              eyebrow="Free Scores"
              title="이번 주 무료 악보"
              description="가입 없이 볼 수 있는 무료 악보. 과목별로 골라보세요."
              href="/score"
            />
            <FreeScoreTabs scores={home.scores} />
          </Section>
        )}

        {open.info && (
        <Section labelledBy="info-title">
          <SectionHeader
            id="info-title"
            eyebrow="Music Info"
            title="음악정보 최신 글"
            description="악기 입문부터 입시, 공모전, 연습실 정보까지."
            href="/info"
          />
          <LatestInfo articles={home.articles} />
        </Section>
        )}

        <Section labelledBy="market-title">
          <SectionHeader
            id="market-title"
            eyebrow="Used Market"
            title="중고 장터 최신 매물"
            description={open.market ? "직거래 중심의 악기·장비 중고 거래. 나눔도 있어요." : undefined}
            href="/gear/market"
          />
          {open.market ? (
            <MarketPreview items={home.market} />
          ) : (
            closedReason("market") ? (
              <ComingSoonCard title="중고 장터는 준비 중이에요" action={{ href: "/gear", label: "장비·악기 정보 보기" }}>
                안전하게 거래할 수 있는 기능을 갖춘 뒤 열 예정이에요.
              </ComingSoonCard>
            ) : (
              <ComingSoonCard title="아직 올라온 매물이 없어요" action={{ href: "/write/market", label: "첫 매물 올리기" }}>
                판매·구매·나눔 글을 올릴 수 있어요.
              </ComingSoonCard>
            )
          )}
        </Section>

        <Section labelledBy="community-title">
          <SectionHeader id="community-title" eyebrow="Community" title="지금 커뮤니티에서는" href="/community" />
          {hasPosts ? <CommunityBoards questions={home.questions} popular={home.popular} /> : <FirstPostCard />}
        </Section>

        <Section labelledBy="recruit-title">
          <SectionHeader
            id="recruit-title"
            eyebrow="Band & Team"
            title="밴드·팀원 모집"
            description={open.recruit ? "취미부터 현역까지, 성격 배지로 나에게 맞는 팀을 찾아보세요." : undefined}
            href="/recruit/band"
          />
          {open.recruit ? (
            <>
              <div className="mb-4">
                <RecruitLegend />
              </div>
              <RecruitList recruits={home.recruits} />
            </>
          ) : (
            closedReason("recruit") ? (
              <ComingSoonCard title="밴드·팀원 모집은 준비 중이에요" action={{ href: "/community", label: "커뮤니티 둘러보기" }}>
                곧 밴드 멤버·세션 모집글을 올릴 수 있게 열 예정이에요.
              </ComingSoonCard>
            ) : (
              <ComingSoonCard title="아직 올라온 모집글이 없어요" action={{ href: "/write/recruit", label: "첫 모집글 쓰기" }}>
                밴드 멤버·세션·강사·오디션 모집글을 올릴 수 있어요.
              </ComingSoonCard>
            )
          )}
        </Section>

        <HowOmuWorks />
        <JoinBanner loginReady={isSupabaseConfigured()} />
      </div>
    </>
  );
}
