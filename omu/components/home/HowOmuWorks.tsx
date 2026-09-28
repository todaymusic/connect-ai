import Link from "next/link";
import { EyeOff, Flag } from "lucide-react";
import { AdminBadge, Badge, EditorBadge, Section, SectionHeader } from "../ui";

/** 에디터·운영자 역할을 배지와 설명으로 소개 (관리 기능은 이후 구현) */
export function HowOmuWorks() {
  return (
    <Section labelledBy="how-title">
      <SectionHeader
        id="how-title"
        eyebrow="Trust"
        title="OMU는 이렇게 운영돼요"
        description="누가 올린 콘텐츠인지, 문제가 생기면 누가 챙기는지 배지로 바로 알 수 있어요."
      />
      <ul className="grid gap-3 md:grid-cols-3">
        <li className="card p-5">
          <EditorBadge />
          <h3 className="mt-3 text-base font-bold text-ink">에디터가 확인한 악보·정보글</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            무료 악보와 음악정보 글은 OMU 에디터가 직접 정리해서 올려요. 에디터가 쓴 글에는 이 배지가 붙어요.
          </p>
        </li>
        <li className="card p-5">
          <AdminBadge />
          <h3 className="mt-3 text-base font-bold text-ink">운영자가 챙기는 게시판</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            공지, 신고 처리, 게시물 관리는 운영자가 맡아요. 불편한 글이나 의심스러운 거래는{" "}
            <span className="inline-flex items-center gap-0.5 font-semibold text-ink">
              <Flag aria-hidden className="size-3.5" />
              신고
            </span>
            해 주세요.
          </p>
        </li>
        <li className="card p-5">
          <Badge tone="neutral">
            <EyeOff aria-hidden className="size-3.5" />
            익명 보호
          </Badge>
          <h3 className="mt-3 text-base font-bold text-ink">익명 게시판은 끝까지 익명</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            익명 게시판 글과 댓글은 작성자 정보가 다른 회원에게 공개되지 않아요.{" "}
            <Link href="/community/anon" className="font-semibold text-blue hover:underline">
              익명 게시판 가기
            </Link>
          </p>
        </li>
      </ul>
    </Section>
  );
}
