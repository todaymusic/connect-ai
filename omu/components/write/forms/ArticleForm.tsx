"use client";

import { useState } from "react";
import { ARTICLE_CATEGORIES } from "@/lib/site";
import { submitArticle, submitArticleEdit } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

export type ArticleEdit = { id: string; isPublished: boolean; authorDisplay: "editor" | "member"; values: Record<string, string> };

/**
 * 정보글 쓰기·수정 — 로그인 회원 누구나.
 *  - 새 글·초안: '임시저장'(초안, 나와 관리자만 봄) / '발행'(바로 공개)
 *  - 공개 글 수정: '수정 저장'(공개 유지 — 초안으로 되돌리기 없음)
 * 작성자 표기(OMU 에디터 배지 / 내 닉네임)는 고르지 않는다 — 작성자 역할로 서버와 DB 가 정한다.
 */
export function ArticleForm({
  mode,
  defaults,
  badge,
  edit,
}: {
  mode: "demo" | "supabase";
  defaults: { category?: string };
  /** 이 글에 붙을 표기 (작성자 역할 기준) */
  badge: "editor" | "member";
  edit?: ArticleEdit;
}) {
  const actions = edit?.isPublished
    ? [{ value: "publish", label: "수정 저장", primary: true }]
    : [
        { value: "draft", label: "임시저장" },
        { value: "publish", label: "발행", primary: true },
      ];
  return (
    <WriteFormShell
      action={edit ? submitArticleEdit : submitArticle}
      mode={mode}
      submitLabel="발행"
      submitActions={actions}
      resetHref={edit ? "/my/articles" : "/info"}
    >
      {({ values, errors }) => (
        <Fields values={Object.keys(values).length ? values : (edit?.values ?? {})} errors={errors} defaults={defaults} badge={badge} edit={edit} />
      )}
    </WriteFormShell>
  );
}

function Fields({
  values,
  errors,
  defaults,
  badge,
  edit,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  defaults: { category?: string };
  badge: "editor" | "member";
  edit?: ArticleEdit;
}) {
  const [category, setCategory] = useState(values.category ?? defaults.category ?? "");

  return (
    <>
      {edit && <input type="hidden" name="edit_id" value={edit.id} />}
      <SelectField
        name="category"
        label="분류"
        required
        value={category}
        onChange={setCategory}
        error={errors.category}
        options={Object.entries(ARTICLE_CATEGORIES).map(([value, label]) => ({ value, label }))}
        hint="장비 정보·악기 정보는 ‘악기’ 메뉴에, 나머지는 ‘음악정보’에 보여요."
      />
      <TextField name="title" label="제목" required maxLength={LIMITS.title} defaultValue={values.title} error={errors.title} placeholder="예) 첫 통기타, 매장에서 확인할 체크리스트" />
      <TextArea
        name="meta_description"
        label="요약(검색 설명)"
        required
        rows={2}
        maxLength={LIMITS.meta}
        defaultValue={values.meta_description}
        error={errors.meta_description}
        hint={`목록 카드와 검색 결과에 보이는 한두 문장 (${LIMITS.meta}자 이하)`}
      />
      <TextArea
        name="content"
        label="본문"
        required
        rows={14}
        defaultValue={values.content}
        error={errors.content}
        hint="빈 줄로 문단, ‘## ’ 소제목, ‘- ’ 목록. 이미지 넣기는 다음 업데이트에서 열려요."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="keywords" label="키워드" defaultValue={values.keywords} error={errors.keywords} hint="쉼표로 구분 (최대 10개)" placeholder="기타, 입문, 구매" />
        <TextField name="youtube_url" label="유튜브 영상" type="url" inputMode="url" defaultValue={values.youtube_url} error={errors.youtube_url} placeholder="https://youtu.be/…" />
      </div>
      <div className="space-y-1.5 rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-ink-2" data-testid="article-publish-note">
        <p>
          작성자 표기: <strong className="text-ink">{badge === "editor" ? "OMU 에디터 배지" : "내 닉네임"}</strong>
          {badge === "editor" ? " (에디터·운영자 계정)" : " (에디터·운영자가 쓴 글에만 OMU 에디터 배지가 붙어요)"}
        </p>
        {edit?.isPublished ? (
          <p>공개 중인 글이에요. 수정하면 바로 반영되고, 공개 상태는 그대로예요.</p>
        ) : (
          <p>
            <strong className="text-ink">발행</strong>하면 검수 없이 바로 누구나 볼 수 있어요. <strong className="text-ink">임시저장</strong>한 글은 나와 관리자만 볼 수
            있고, ‘내 정보글’에서 나중에 발행할 수 있어요. 발행한 글은 초안으로 되돌릴 수 없고 수정·삭제만 할 수 있어요.
          </p>
        )}
      </div>
    </>
  );
}
