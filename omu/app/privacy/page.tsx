import Link from "next/link";
import type { Metadata } from "next";
import { LegalDoc, Table, Ul, type LegalSection } from "@/components/legal/LegalDoc";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "OMU 개인정보처리방침 (초안).",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "purpose",
    title: "개인정보의 처리 목적",
    body: (
      <Ul
        items={[
          "회원 식별과 로그인 유지(카카오·네이버 소셜 로그인)",
          "게시물·댓글 작성자 표시와 관리, 신고 처리, 부정 이용 방지",
          "고객 문의 응대와 공지 전달",
        ]}
      />
    ),
  },
  {
    id: "items",
    title: "처리하는 개인정보 항목",
    body: (
      <Table
        head={["구분", "항목", "수집 방법"]}
        rows={[
          ["카카오 로그인", "회원 식별값, 닉네임, 프로필 사진, 이메일(동의한 경우)", "카카오 로그인 동의 화면"],
          ["네이버 로그인", "회원 식별값, 별명, 프로필 사진, 이메일(동의한 경우)", "네이버 로그인 동의 화면"],
          ["서비스 이용", "게시물·댓글, 거래·모집글에 적은 지역과 연락 안내, 장터 사진", "회원이 직접 입력"],
          ["비회원 글·댓글·신고", "자동 표시 이름, 브라우저가 만든 무작위 값의 해시(수정·삭제 확인용). 이메일·전화번호 등은 받지 않음", "비회원이 작성할 때"],
          ["도배 방지 기록", "접속 IP 의 단방향 해시(원본 IP 는 저장하지 않음), 작성 시각 — 2일 뒤 자동 삭제", "비회원 글·댓글·신고 작성 시"],
          ["자동 수집", "접속 기록, 로그인 세션 쿠키, 기기·브라우저 정보", "서비스 이용 과정"],
        ]}
      />
    ),
  },
  {
    id: "retention",
    title: "보유 및 이용 기간",
    body: (
      <Ul
        items={[
          "회원 정보: 탈퇴할 때까지. 탈퇴하면 지체 없이 파기합니다.",
          "부정 이용 방지를 위한 최소 정보: 탈퇴 후 [기간 확정 필요] 보관 후 파기",
          "접속 기록: 통신비밀보호법에 따라 3개월",
        ]}
      />
    ),
  },
  {
    id: "third-party",
    title: "제3자 제공",
    body: <p>운영자는 회원의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거한 수사기관 요청 등 법이 정한 경우는 예외로 합니다.</p>,
  },
  {
    id: "outsourcing",
    title: "처리 위탁 및 국외 이전",
    body: (
      <>
        <Table
          head={["수탁자", "위탁 업무", "보관 위치"]}
          rows={[
            ["Supabase Inc.", "회원 인증, 데이터베이스·파일 저장", "[프로젝트 리전 확정 — 예: 대한민국(서울)]"],
            ["Vercel Inc.", "웹사이트 호스팅·전송", "미국 등 전 세계 전송망"],
          ]}
        />
        <p>국외 이전 항목·시기·방법과 이전을 원하지 않을 때의 방법은 [확정 필요] 로 안내합니다.</p>
      </>
    ),
  },
  {
    id: "destroy",
    title: "개인정보의 파기",
    body: <p>보유 기간이 끝나거나 처리 목적이 달성되면 전자 파일은 복구할 수 없는 방법으로 지체 없이 삭제합니다.</p>,
  },
  {
    id: "rights",
    title: "정보주체의 권리와 행사 방법",
    body: (
      <p>
        회원은 언제든 자신의 개인정보 열람·정정·삭제·처리 정지를 요청할 수 있습니다. <Link href="/contact" className="text-blue underline">고객센터</Link> 또는{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue underline">{CONTACT_EMAIL}</a> 로 요청하면 지체 없이 처리합니다. 소셜 계정 연결 해제는 카카오·네이버 계정 설정에서도 할 수 있습니다.
      </p>
    ),
  },
  {
    id: "security",
    title: "안전성 확보 조치",
    body: (
      <Ul
        items={[
          "데이터베이스 행 단위 접근 제어(RLS)로 본인 글만 수정·삭제되도록 제한",
          "익명 게시물 작성자 정보는 외부에 노출되지 않도록 분리 보관",
          "전송 구간 암호화(HTTPS), 관리자 권한 최소화",
        ]}
      />
    ),
  },
  {
    id: "cookies",
    title: "쿠키의 사용",
    body: <>
        <p>로그인 상태를 유지하기 위해 세션 쿠키를 사용합니다. 광고 목적의 추적 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키를 거부할 수 있지만, 그 경우 로그인이 필요한 기능을 쓸 수 없습니다.</p>
        <p>비회원이 쓴 글·댓글을 그 브라우저에서 고치거나 지울 수 있도록, 브라우저 저장소(localStorage)에 무작위 값을 보관합니다. 이 값은 개인을 식별하지 않으며, 서버에는 해시만 저장됩니다. 브라우저 기록을 지우면 함께 사라집니다.</p>
      </>,
  },
  {
    id: "officer",
    title: "개인정보 보호책임자",
    body: (
      <Ul
        items={[
          "책임자: [성명 · 직책 확정 필요]",
          <>연락처: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue underline">{CONTACT_EMAIL}</a></>,
          "개인정보 침해 신고: 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972)",
        ]}
      />
    ),
  },
  {
    id: "changes",
    title: "방침의 변경",
    body: <p>이 방침이 바뀌면 시행 7일 전부터 서비스 공지로 알립니다.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="개인정보처리방침"
      updated="[시행일 확정 필요]"
      intro={<p>[운영 주체명](이하 ‘운영자’)은 OMU 서비스를 제공하면서 이용자의 개인정보를 「개인정보 보호법」에 따라 처리합니다.</p>}
      sections={SECTIONS}
    />
  );
}
