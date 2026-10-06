import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, FileText, MessageCircleQuestion, Users } from "lucide-react";
import { PostRow } from "@/components/cards/PostRow";
import { RecruitCard } from "@/components/cards/RecruitCard";
import { ScoreCard } from "@/components/cards/ScoreCard";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { Breadcrumbs, CommentsSection, DetailShell, InfoList, JsonLd, ReportButton, TwoColumn } from "@/components/detail/DetailParts";
import { Badge, FreeBadge } from "@/components/ui";
import { listComments, listPosts } from "@/lib/data/posts";
import { listRecruits } from "@/lib/data/recruits";
import { getScore, listRelatedScores, listScores } from "@/lib/data/scores";
import { scoreFileUrl } from "@/lib/data/storage";
import { formatCount, formatDate } from "@/lib/format";
import { DEFAULT_OG_IMAGE, DIFFICULTIES, QNA_SUBJECTS, SCORE_INSTRUMENTS, isKey, siteUrl } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const { items } = await listScores({ pageSize: 500 });
  return items.map((s) => ({ instrument: s.instrument, slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/score/[instrument]/[slug]">): Promise<Metadata> {
  const { instrument, slug } = await params;
  const score = await getScore(instrument, slug);
  if (!score) return { title: "악보를 찾을 수 없어요", robots: { index: false } };
  const title = `${score.title} ${SCORE_INSTRUMENTS[score.instrument]} 악보`;
  const image = score.thumbnailUrl || DEFAULT_OG_IMAGE;
  return {
    title,
    description: score.description,
    alternates: { canonical: `/score/${score.instrument}/${score.slug}` },
    openGraph: { title, description: score.description, type: "article", images: [image] },
    twitter: { card: "summary_large_image", title, description: score.description, images: [image] },
  };
}

export default async function ScoreDetailPage({ params }: PageProps<"/score/[instrument]/[slug]">) {
  const { instrument, slug } = await params;
  if (!isKey(SCORE_INSTRUMENTS, instrument)) notFound();
  const score = await getScore(instrument, slug);
  if (!score) notFound();

  const subject = isKey(QNA_SUBJECTS, score.instrument) ? score.instrument : undefined;
  const [related, linkedQna, subjectQna, recruits, comments] = await Promise.all([
    listRelatedScores(score, 4),
    listPosts({ relatedScoreSlug: score.slug, pageSize: 3 }),
    subject ? listPosts({ category: "qna", subject, pageSize: 3 }) : Promise.resolve(null),
    listRecruits({ category: "band", openOnly: true, pageSize: 2 }),
    listComments("score", score.id),
  ]);
  // 곡에 직접 연결된 질문 먼저, 모자라면 같은 과목 Q&A 로 채운다
  const qna = [...linkedQna.items, ...(subjectQna?.items ?? []).filter((p) => !linkedQna.items.some((l) => l.id === p.id))].slice(0, 3);
  const fileHref = scoreFileUrl(score.fileUrl);
  const instrumentLabel = SCORE_INSTRUMENTS[score.instrument];
  const url = `${siteUrl()}/score/${score.instrument}/${score.slug}`;

  return (
    <DetailShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicComposition",
          name: score.title,
          url,
          description: score.description,
          genre: score.genre || undefined,
          inLanguage: "ko-KR",
          isAccessibleForFree: true,
          ...(score.artist && !score.artist.startsWith("OMU") ? { composer: { "@type": "Person", name: score.artist } } : {}),
          educationalLevel: DIFFICULTIES[score.difficulty],
          encodingFormat: "application/pdf",
          ...(score.thumbnailUrl ? { image: score.thumbnailUrl } : {}),
          datePublished: score.createdAt,
          publisher: { "@type": "Organization", name: "OMU" },
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "홈" },
          { href: "/score", label: "악보공유" },
          { href: `/score/${score.instrument}`, label: instrumentLabel },
          { href: `/score/${score.instrument}/${score.slug}`, label: score.title },
        ]}
      />

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <FreeBadge />
          <Badge>{instrumentLabel}</Badge>
          <Badge tone="outline">{DIFFICULTIES[score.difficulty]}</Badge>
          {score.genre && <Badge tone="outline">{score.genre}</Badge>}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{score.title}</h1>
        <p className="mt-1 text-sm text-ink-2">{score.artist}</p>
      </header>

      <TwoColumn
        main={
          <>
            {/* 미리보기 — PDF 첫 페이지 이미지(누르면 PDF 새 탭), 없으면 오선지 자리표시 */}
            {score.thumbnailUrl ? (
              <figure className="rounded-2xl border border-line bg-stone px-4 py-5 sm:px-8 sm:py-7">
                {fileHref ? (
                  <a href={fileHref} target="_blank" rel="noopener" className="group mx-auto block w-full max-w-[440px]">
                    <ScorePreviewImage src={score.thumbnailUrl} title={score.title} />
                    <span className="sr-only"> (PDF 전체 악보를 새 탭에서 열기)</span>
                  </a>
                ) : (
                  <div className="mx-auto w-full max-w-[440px]">
                    <ScorePreviewImage src={score.thumbnailUrl} title={score.title} />
                  </div>
                )}
                <figcaption className="mt-3 text-center text-xs text-ink-3">
                  {fileHref ? "첫 페이지 미리보기 · 누르면 PDF 전체 악보가 새 탭에서 열려요" : "첫 페이지 미리보기"}
                </figcaption>
              </figure>
            ) : (
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-line bg-card sm:aspect-[16/10]">
                <svg aria-hidden viewBox="0 0 400 240" className="absolute inset-0 size-full">
                  {[0, 1, 2].map((staff) =>
                    [0, 1, 2, 3, 4].map((i) => (
                      <line key={`${staff}-${i}`} x1="30" x2="370" y1={50 + staff * 65 + i * 8} y2={50 + staff * 65 + i * 8} stroke="#1E1B18" strokeOpacity="0.12" />
                    )),
                  )}
                </svg>
                <div className="relative rounded-2xl bg-card/90 px-5 py-4 text-center shadow-[var(--shadow-card)]">
                  <FileText aria-hidden className="mx-auto size-7 text-ink-3" />
                  <p className="mt-2 text-sm font-semibold text-ink">악보 미리보기</p>
                  <p className="mt-0.5 text-xs text-ink-3">{fileHref ? "PDF 를 열어 전체 악보를 확인하세요" : "PDF 파일이 등록되면 미리보기가 열려요"}</p>
                </div>
              </div>
            )}

            <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{score.description}</p>

            {/* 곡 중심 동선: 이 곡 관련 질문 → 같이 칠 사람 */}
            <section aria-labelledby="qna-title" className="mt-10">
              <div className="flex items-end justify-between gap-3">
                <h2 id="qna-title" className="flex items-center gap-2 text-lg font-extrabold text-ink">
                  <MessageCircleQuestion aria-hidden className="size-5" />이 곡 관련 질문
                </h2>
                <Link
                  href={`/write/community?category=qna${subject ? `&subject=${subject}` : ""}&score=${score.slug}`}
                  className="shrink-0 text-sm font-semibold text-blue hover:underline"
                >
                  질문하기
                </Link>
              </div>
              {qna.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-stone px-4 py-5 text-sm text-ink-2">아직 이 곡에 대한 질문이 없어요.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                  {qna.map((p) => (
                    <li key={p.id}>
                      <PostRow post={p} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="together-title" className="mt-10">
              <div className="flex items-end justify-between gap-3">
                <h2 id="together-title" className="flex items-center gap-2 text-lg font-extrabold text-ink">
                  <Users aria-hidden className="size-5" />
                  같이 칠 사람
                </h2>
                <Link href="/write/recruit?category=band" className="shrink-0 text-sm font-semibold text-blue hover:underline">
                  멤버 구하기
                </Link>
              </div>
              {recruits.items.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-stone px-4 py-5 text-sm text-ink-2">지금 모집 중인 밴드가 없어요.</p>
              ) : (
                <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
                  {recruits.items.map((r) => (
                    <li key={r.id}>
                      <RecruitCard recruit={r} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <CommentsSection threads={comments} threadType="score" threadId={score.id} path={`/score/${score.instrument}/${score.slug}`} />
          </>
        }
        aside={
          <>
            <div className="card p-4">
              {fileHref ? (
                <a
                  href={fileHref}
                  target="_blank"
                  rel="noopener"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-coral text-[15px] font-bold text-white hover:bg-coral-deep"
                >
                  <Download aria-hidden className="size-5" />
                  무료 PDF 다운로드
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-stone text-[15px] font-bold text-ink-3"
                >
                  <Download aria-hidden className="size-5" />
                  PDF 준비 중
                </button>
              )}
              <p className="mt-2 text-center text-xs text-ink-3">
                {fileHref ? "로그인 없이 무료로 받을 수 있어요." : "데모 악보라 아직 파일이 없어요. 파일이 등록되면 바로 받을 수 있어요."}
              </p>
            </div>
            <InfoList
              rows={[
                { label: "악기", value: instrumentLabel },
                { label: "난이도", value: DIFFICULTIES[score.difficulty] },
                { label: "파트", value: score.parts.join(" · ") || "—" },
                { label: "분량", value: score.pages ? `${score.pages}쪽` : "—" },
                { label: "다운로드", value: `${formatCount(score.downloads)}회` },
                { label: "등록일", value: formatDate(score.createdAt) },
                { label: "등록", value: <AuthorLabel author={score.author} display="editor" /> },
              ]}
            />
            <div className="flex justify-end">
              <ReportButton targetType="score" targetId={score.id} title={score.title} path={`/score/${score.instrument}/${score.slug}`} />
            </div>
          </>
        }
      />

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-12">
          <h2 id="related-title" className="text-lg font-extrabold text-ink">
            {instrumentLabel} 악보 더 보기
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {related.map((s) => (
              <li key={s.id}>
                <ScoreCard score={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </DetailShell>
  );
}

/** 상세 페이지 큰 미리보기 — 세로 3:4, 위쪽 기준으로 잘라 제목·첫 줄이 보이게 */
function ScorePreviewImage({ src, title }: { src: string; title: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 주소
    <img
      src={src}
      alt={`${title} 악보 첫 페이지 미리보기`}
      loading="lazy"
      decoding="async"
      className="aspect-[3/4] w-full rounded-md bg-white object-cover object-top shadow-[0_4px_18px_rgba(30,27,24,0.14)] transition-transform duration-300 group-hover:-translate-y-0.5"
    />
  );
}
