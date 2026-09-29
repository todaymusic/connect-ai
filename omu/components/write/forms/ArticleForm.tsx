"use client";

import { useState } from "react";
import { ARTICLE_CATEGORIES, articlePath } from "@/lib/site";
import { submitArticle } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { CheckboxField, ChoiceField, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";
import { TitleSlugFields } from "./SlugFields";

export function ArticleForm({ mode, isAdmin, defaults }: { mode: "demo" | "supabase"; isAdmin: boolean; defaults: { category?: string } }) {
  return (
    <WriteFormShell action={submitArticle} mode={mode} submitLabel={isAdmin ? "저장하기" : "초안 저장"} resetHref="/info">
      {({ values, errors }) => <Fields values={values} errors={errors} isAdmin={isAdmin} defaults={defaults} />}
    </WriteFormShell>
  );
}

function Fields({
  values,
  errors,
  isAdmin,
  defaults,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  isAdmin: boolean;
  defaults: { category?: string };
}) {
  const [category, setCategory] = useState(values.category ?? defaults.category ?? "");
  const [display, setDisplay] = useState(values.author_display ?? "editor");
  const prefix = category ? articlePath(category, "").replace(/\/$/, "") : "/info/분류";

  return (
    <>
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
      <TitleSlugFields titleLabel="제목" pathPrefix={prefix} values={values} errors={errors} placeholder="예) 첫 통기타, 30만 원 안에서 고르는 체크리스트" />
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
      <ChoiceField
        name="author_display"
        label="작성자 표기"
        required
        value={display}
        onChange={setDisplay}
        options={[
          { value: "editor", label: "OMU 에디터" },
          { value: "member", label: "내 닉네임" },
        ]}
      />
      {isAdmin ? (
        <CheckboxField name="is_published" label="바로 발행하기" defaultChecked={values.is_published === "on"} hint="끄면 초안으로 저장돼요. 초안은 관리자·작성자만 볼 수 있어요." />
      ) : (
        <p className="rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-ink-2">에디터가 쓴 글은 <strong className="text-ink">초안</strong>으로 저장되고, 관리자가 발행하면 공개돼요.</p>
      )}
    </>
  );
}
