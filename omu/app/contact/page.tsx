import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Copyright, Flag, Mail, Phone, ShieldCheck, UserCog } from "lucide-react";
import { CONTACT, hasContact } from "@/lib/site";

export const metadata: Metadata = {
  title: "고객센터",
  description: "OMU 고객센터 — 계정·신고·저작권·개인정보 문의 안내.",
  alternates: { canonical: "/contact" },
};

const TOPICS = [
  { icon: UserCog, title: "계정·로그인", body: "소셜 로그인 오류, 닉네임 변경, 탈퇴 요청" },
  { icon: Flag, title: "게시물 신고", body: "욕설·비방, 개인정보 노출, 도배 게시물" },
  { icon: Copyright, title: "저작권 침해 신고", body: "권리자 확인 후 해당 게시물을 내립니다" },
  { icon: ShieldCheck, title: "개인정보 문의", body: "열람·정정·삭제·처리 정지 요청" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">고객센터</h1>

      {hasContact() ? (
        // 공식 연락처(lib/site.ts CONTACT)가 정해지면 보이는 안내
        <div className="card mt-6 space-y-2 p-5">
          {CONTACT.email && (
            <p className="flex items-center gap-2 text-[15px] text-ink">
              <Mail aria-hidden className="size-4 text-ink-2" />
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-blue hover:underline">
                {CONTACT.email}
              </a>
            </p>
          )}
          {CONTACT.phone && (
            <p className="flex items-center gap-2 text-[15px] text-ink">
              <Phone aria-hidden className="size-4 text-ink-2" />
              <a href={`tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}`} className="font-semibold text-blue hover:underline">
                {CONTACT.phone}
              </a>
            </p>
          )}
        </div>
      ) : (
        <div className="card mt-6 flex items-start gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone text-ink-2">
            <Clock aria-hidden className="size-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-ink">문의 채널은 준비 중이에요</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">연락처가 정해지면 이 페이지에 안내할게요.</p>
          </div>
        </div>
      )}

      <h2 className="mt-10 text-lg font-extrabold text-ink">이런 문의를 받을 예정이에요</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((t) => (
          <li key={t.title} className="card flex h-full items-start gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone text-ink-2">
              <t.icon aria-hidden className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-ink">{t.title}</span>
              <span className="mt-0.5 block text-sm text-ink-2">{t.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-extrabold text-ink">게시물 신고</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        문제가 있는 글이나 댓글은 해당 화면의 ‘신고하기’ 버튼으로 알려 주세요. 신고할 때 사유와 함께 확인할 수 있는 내용을 적어 주시면 빨리 처리할 수 있어요.
      </p>

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
