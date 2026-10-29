"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ARTICLE_CATEGORIES } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitArticle, submitArticleEdit } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { FieldShell, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

export type ArticleEdit = {
  id: string;
  isPublished: boolean;
  authorDisplay: "editor" | "member";
  /** 지금 걸려 있는 대표 사진 주소 */
  coverUrl?: string | null;
  values: Record<string, string>;
};

const MAX_COVER_SOURCE = 20 * 1024 * 1024; // 고르는 원본 한도 — 올릴 때는 1600px JPEG 로 줄인다
const COVER_WIDTH = 1600;

/** 고른 사진을 가로 1600px 이하 JPEG 로 줄인다 (thumbnails 버킷 한도 5MB 안쪽) */
async function shrinkCover(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, COVER_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("toBlob");
  return blob;
}

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
  canUploadCover = false,
}: {
  mode: "demo" | "supabase";
  defaults: { category?: string };
  /** 이 글에 붙을 표기 (작성자 역할 기준) */
  badge: "editor" | "member";
  edit?: ArticleEdit;
  /** 대표 사진 올리기 — 에디터·관리자만 (thumbnails 버킷 권한) */
  canUploadCover?: boolean;
}) {
  /** 제출 전: 대표 사진을 줄여서 Storage 에 먼저 올리고 경로만 서버로 보낸다 */
  async function prepare(fd: FormData) {
    const file = fd.get("cover");
    fd.delete("cover");
    if (!(file instanceof File) || file.size === 0) return { ok: true as const, fd };
    if (!file.type.startsWith("image/")) return { ok: false as const, message: "대표 사진은 이미지 파일만 올릴 수 있어요." };
    if (file.size > MAX_COVER_SOURCE) return { ok: false as const, message: "대표 사진은 20MB 이하만 올릴 수 있어요." };
    if (mode === "demo") return { ok: true as const, fd }; // 데모는 사진을 저장하지 않는다
    let blob: Blob;
    try {
      blob = await shrinkCover(file);
    } catch {
      return { ok: false as const, message: "사진을 읽지 못했어요. JPG·PNG 파일로 다시 골라 주세요." };
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false as const, message: "스토리지에 연결하지 못했어요." };
    const path = `articles/${slugify(String(fd.get("title") ?? ""), 60) || "article"}-${Date.now().toString(36)}.jpg`;
    const { error } = await supabase.storage.from("thumbnails").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) return { ok: false as const, message: "대표 사진을 올리지 못했어요. 에디터 권한을 확인해 주세요." };
    fd.set("thumbnail_path", path);
    fd.delete("thumbnail_remove");
    return { ok: true as const, fd };
  }

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
      prepare={canUploadCover ? prepare : undefined}
    >
      {({ values, errors }) => (
        <Fields
          values={Object.keys(values).length ? values : (edit?.values ?? {})}
          errors={errors}
          defaults={defaults}
          badge={badge}
          edit={edit}
          canUploadCover={canUploadCover}
          mode={mode}
        />
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
  canUploadCover,
  mode,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  defaults: { category?: string };
  badge: "editor" | "member";
  edit?: ArticleEdit;
  canUploadCover: boolean;
  mode: "demo" | "supabase";
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
      {canUploadCover && <CoverField currentUrl={edit?.coverUrl ?? null} mode={mode} />}
      <TextArea
        name="content"
        label="본문"
        required
        rows={14}
        defaultValue={values.content}
        error={errors.content}
        hint="빈 줄로 문단, ‘## ’ 소제목, ‘- ’ 목록. 본문 속 이미지는 다음 업데이트에서 열려요."
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

/**
 * 대표 사진 — 목록 카드·글 상단·공유 미리보기에 쓰인다.
 * 고르면 바로 미리보기, 등록할 때 폼이 가로 1600px JPEG 로 줄여 thumbnails 버킷에 올린다.
 * 수정 화면에서는 지금 사진이 보이고, '사진 빼기'를 누르면 저장할 때 비운다.
 */
function CoverField({ currentUrl, mode }: { currentUrl: string | null; mode: "demo" | "supabase" }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (picked) URL.revokeObjectURL(picked);
  }, [picked]);

  const shown = picked ?? (removed ? null : currentUrl);

  function onPick(file: File | undefined) {
    setPicked(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPicked(null);
    setRemoved(Boolean(currentUrl));
  }

  return (
    <FieldShell
      name="cover"
      label="대표 사진"
      hint={
        mode === "demo"
          ? "데모 모드에서는 사진을 저장하지 않고 미리보기만 확인해요."
          : "목록 카드·글 맨 위·카톡 공유 미리보기에 보여요. 가로 사진(16:9)이 가장 잘 맞고, 올릴 때 자동으로 줄여요."
      }
    >
      {removed && <input type="hidden" name="thumbnail_remove" value="1" />}
      <div className="space-y-3">
        {shown && (
          <div className="relative overflow-hidden rounded-xl border border-line bg-stone" data-testid="article-cover-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- 미리보기(blob URL 또는 공개 버킷) */}
            <img src={shown} alt="대표 사진 미리보기" className="aspect-[16/9] w-full object-cover" />
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-paper hover:bg-ink"
            >
              <X aria-hidden className="size-3.5" />
              사진 빼기
            </button>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-2 bg-paper px-4 py-4 text-sm text-ink-2 hover:border-ink-3">
          <ImagePlus aria-hidden className="size-5 shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="min-w-0 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-paper"
          />
        </label>
        {removed && !picked && <p className="text-xs text-ink-3">저장하면 대표 사진이 빠져요.</p>}
      </div>
    </FieldShell>
  );
}
