import { CategoryShortcuts } from "@/components/home/CategoryShortcuts";
import { CommunityBoards } from "@/components/home/CommunityBoards";
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
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// 5분마다 다시 만든다 (Supabase 연결 후 새 글이 홈에 반영되도록)
export const revalidate = 300;

// 홈 섹션 순서는 작업지시서 9-2 (검색 → 배너 → 무료 악보 → 정보 → 중고 → 커뮤니티 → 구인)
export default async function HomePage() {
  const home = await getHomeData();
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
      <Hero stats={home.stats} keywords={POPULAR_KEYWORDS} />
      <NewsStrip />

      <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-20">
        <CategoryShortcuts />

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
            description="직거래 중심의 악기·장비 중고 거래. 나눔도 있어요."
            href="/gear/market"
          />
          <MarketPreview items={home.market} />
        </Section>

        <Section labelledBy="community-title">
          <SectionHeader id="community-title" eyebrow="Community" title="지금 커뮤니티에서는" href="/community" />
          <CommunityBoards questions={home.questions} popular={home.popular} />
        </Section>

        <Section labelledBy="recruit-title">
          <SectionHeader
            id="recruit-title"
            eyebrow="Band & Team"
            title="밴드·팀원 모집"
            description="취미부터 현역까지, 성격 배지로 나에게 맞는 팀을 찾아보세요."
            href="/recruit/band"
          />
          <div className="mb-4">
            <RecruitLegend />
          </div>
          <RecruitList recruits={home.recruits} />
        </Section>

        <HowOmuWorks />
        <JoinBanner />
      </div>
    </>
  );
}
