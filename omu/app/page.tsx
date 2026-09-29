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
  // 콘텐츠가 없는 코너는 빈 그리드 대신 '준비 중' 안내 (허위 콘텐츠·0건 자랑 금지)
  const open = {
    scores: home.totals.scores > 0,
    market: !closedReason("market") && home.totals.market > 0,
    recruit: !closedReason("recruit") && home.totals.recruits > 0,
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
      <Hero stats={home.stats} keywords={POPULAR_KEYWORDS} open={open} />
      <NewsStrip />

      <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-20">
        <CategoryShortcuts />

        <Section labelledBy="free-scores-title">
          <SectionHeader
            id="free-scores-title"
            eyebrow="Free Scores"
            title="이번 주 무료 악보"
            description={open.scores ? "가입 없이 볼 수 있는 무료 악보. 과목별로 골라보세요." : undefined}
            href="/score"
          />
          {open.scores ? (
            <FreeScoreTabs scores={home.scores} />
          ) : (
            <ComingSoonCard title="무료 악보는 준비 중이에요" action={{ href: "/score/requests", label: "악보 요청 보기" }}>
              저작권을 확인한 악보만 올릴 예정이에요. 찾는 곡이 있다면 악보 요청을 남겨 주세요.
            </ComingSoonCard>
          )}
        </Section>

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
            <ComingSoonCard title="중고 장터는 준비 중이에요" action={{ href: "/gear", label: "장비·악기 정보 보기" }}>
              안전하게 거래할 수 있는 기능을 갖춘 뒤 열 예정이에요.
            </ComingSoonCard>
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
            <ComingSoonCard title="밴드·팀원 모집은 준비 중이에요" action={{ href: "/community", label: "커뮤니티 둘러보기" }}>
              곧 밴드 멤버·세션 모집글을 올릴 수 있게 열 예정이에요.
            </ComingSoonCard>
          )}
        </Section>

        <HowOmuWorks />
        <JoinBanner loginReady={isSupabaseConfigured()} />
      </div>
    </>
  );
}
