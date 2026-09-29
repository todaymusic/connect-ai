import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Copyright, Flag, Mail, ShieldCheck, UserCog } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "고객센터",
  description: "OMU 고객센터 — 계정·신고·저작권·개인정보 문의 안내.",
  alternates: { canonical: "/contact" },
};

const TOPICS = [
  { icon: UserCog, title: "계정·로그인", body: "소셜 로그인 오류, 닉네임 변경, 탈퇴 요청", subject: "[계정] " },
  { icon: Flag, title: "게시물 신고", body: "사기 의심 거래, 욕설·비방, 개인정보 노출 게시물", subject: "[신고] " },
  { icon: Copyright, title: "저작권 침해 신고", body: "권리자 확인 후 해당 악보·게시물을 즉시 내립니다", subject: "[저작권] " },
  { icon: ShieldCheck, title: "개인정보 문의", body: "열람·정정·삭제·처리 정지 요청", subject: "[개인정보] " },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">고객센터</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">궁금한 점이나 불편한 점을 알려 주세요. 이메일로 받고 있어요.</p>

      <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Mail aria-hidden className="size-4" />
            이메일 문의
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-display mt-1 block text-lg font-bold text-blue hover:underline">
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-ink-2">
          <Clock aria-hidden className="size-4" />
          평일 기준 1~2일 안에 답변드려요 [운영 시간 확정 필요]
        </p>
      </div>

      <h2 className="mt-10 text-lg font-extrabold text-ink">문의 유형</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <li key={t.title}>
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.subject)}`} className="card card-hover flex h-full items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone text-ink-2">
                <t.icon aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block text-[15px] font-bold text-ink">{t.title}</span>
                <span className="mt-0.5 block text-sm text-ink-2">{t.body}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-extrabold text-ink">신고할 때 함께 보내 주세요</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-ink-2">
        <li>문제가 된 게시물 주소(URL)</li>
        <li>신고 사유와 확인할 수 있는 자료(대화 캡처 등)</li>
        <li>저작권 신고라면 권리자임을 확인할 수 있는 자료</li>
      </ul>
      <p className="mt-3 text-sm text-ink-3">게시물 화면의 ‘신고’ 버튼은 곧 열려요. 그전까지는 이메일로 신고해 주세요.</p>

      <h2 className="mt-10 text-lg font-extrabold text-ink">운영 정보</h2>
      <dl className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card text-sm">
        {[
          ["서비스명", "OMU"],
          ["운영 주체", "[운영 주체명 확정 필요]"],
          ["사업자 정보", "[사업자등록번호 등 — 필요 시 기재]"],
          ["개인정보 보호책임자", "[성명 확정 필요]"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-right font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-ink-2">
        함께 읽어 주세요:{" "}
        <Link href="/terms" className="font-semibold text-blue hover:underline">
          이용약관
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="font-semibold text-blue hover:underline">
          개인정보처리방침
        </Link>
      </p>
    </div>
  );
}
