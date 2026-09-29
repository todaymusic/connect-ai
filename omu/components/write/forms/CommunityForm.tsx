"use client";

import { useState } from "react";
import { COMMUNITY_CATEGORIES, QNA_SUBJECTS } from "@/lib/site";
import { submitCommunity } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { CheckboxField, ChoiceField, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

export function CommunityForm({
  mode,
  defaults,
  guest = false,
}: {
  mode: "demo" | "supabase";
  defaults: { category?: string; subject?: string };
  /** 로그인하지 않은 비회원 작성 */
  guest?: boolean;
}) {
  return (
    <WriteFormShell action={submitCommunity} mode={mode} submitLabel={guest ? "비회원으로 등록하기" : "등록하기"} resetHref="/community" guest={guest}>
      {({ values, errors }) => <Fields values={values} errors={errors} defaults={defaults} guest={guest} />}
    </WriteFormShell>
  );
}

function Fields({
  values,
  errors,
  defaults,
  guest,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  defaults: { category?: string; subject?: string };
  guest: boolean;
}) {
  const [category, setCategory] = useState(values.category ?? defaults.category ?? "free");
  const [anonymous, setAnonymous] = useState(values.is_anonymous === "on");
  const forcedAnon = category === "anon";

  return (
    <>
      <ChoiceField
        name="category"
        label="게시판"
        required
        value={category}
        onChange={setCategory}
        error={errors.category}
        options={Object.entries(COMMUNITY_CATEGORIES).map(([value, label]) => ({ value, label }))}
      />
      {category === "qna" && (
        <SelectField
          name="qna_subject"
          label="질문 과목"
          required
          defaultValue={values.qna_subject ?? defaults.subject}
          error={errors.qna_subject}
          options={Object.entries(QNA_SUBJECTS).map(([value, label]) => ({ value, label }))}
        />
      )}
      <TextField
        name="title"
        label="제목"
        required
        maxLength={LIMITS.title}
        defaultValue={values.title}
        error={errors.title}
        hint={`${LIMITS.minTitle}자 이상`}
        placeholder="제목을 입력해 주세요"
      />
      <TextArea
        name="content"
        label="본문"
        required
        rows={10}
        maxLength={LIMITS.content}
        defaultValue={values.content}
        error={errors.content}
        hint={`${LIMITS.minContent}자 이상. 빈 줄로 문단을 나누고, ‘## ’ 로 소제목, ‘- ’ 로 목록을 쓸 수 있어요.`}
        placeholder={category === "qna" ? "무엇이 궁금한지, 어디까지 해봤는지 적으면 답을 받기 쉬워요." : "내용을 입력해 주세요"}
      />
      <TextField
        name="youtube_url"
        label="유튜브 영상 링크"
        type="url"
        inputMode="url"
        defaultValue={values.youtube_url}
        error={errors.youtube_url}
        hint={category === "showcase" ? "연주 영상을 붙이면 글 안에 바로 재생돼요." : "youtube.com 또는 youtu.be 주소만 넣을 수 있어요."}
        placeholder="https://youtu.be/…"
      />
      <TextField
        name="tags"
        label="태그"
        defaultValue={values.tags}
        error={errors.tags}
        hint={`쉼표로 구분해 ${LIMITS.tags}개까지 (예: F코드, 바레)`}
        placeholder="F코드, 바레"
      />
      {guest ? (
        <p className="rounded-xl bg-stone px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          비회원 글은 작성자 이름이 자동으로 정해져요(예: ‘새벽 기타리스트’). 닉네임을 쓰거나 익명 여부를 고르려면 로그인해 주세요.
        </p>
      ) : (
      <CheckboxField
        name="is_anonymous"
        label="익명으로 쓰기"
        checked={forcedAnon || anonymous}
        disabled={forcedAnon}
        onChange={setAnonymous}
        hint={forcedAnon ? "익명 게시판 글은 항상 익명이에요." : "닉네임 대신 ‘익명’으로 보여요. 운영 정책 위반 시 운영자는 작성자를 확인할 수 있어요."}
      />
      )}
      {/* disabled 체크박스는 전송되지 않으므로 익명 게시판은 서버가 강제로 익명 처리한다 */}
    </>
  );
}
