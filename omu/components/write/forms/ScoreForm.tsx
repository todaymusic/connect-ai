"use client";

import { FileUp, ImageOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { DIFFICULTIES, SCORE_GENRES, SCORE_INSTRUMENTS } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitScore } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { FieldShell, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

const MAX_PDF = 20 * 1024 * 1024; // schema.sql 의 scores 버킷 한도와 같다

const isPdf = (file: File) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

/** 첫 페이지 미리보기 작업 — 결과가 없으면(null) 썸네일 없이 등록한다 */
type ThumbJob = Promise<Blob | null> | null;

export function ScoreForm({ mode }: { mode: "demo" | "supabase" }) {
  const [instrument, setInstrument] = useState("");
  const thumbJob = useRef<ThumbJob>(null);

  /** 제출 전: PDF 를 브라우저에서 Storage 로 먼저 올리고 경로만 서버로 보낸다(서버 액션 본문 한도 회피) */
  async function prepare(fd: FormData) {
    const file = fd.get("file");
    fd.delete("file");
    const hasFile = file instanceof File && file.size > 0;
    if (hasFile) {
      if (!isPdf(file)) return { ok: false as const, message: "PDF 파일만 올릴 수 있어요." };
      if (file.size > MAX_PDF) return { ok: false as const, message: "PDF 는 20MB 이하만 올릴 수 있어요." };
      fd.set("file_name", file.name);
    }
    if (mode === "demo" || !hasFile) return { ok: true as const, fd }; // 데모는 파일을 저장하지 않는다

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false as const, message: "스토리지에 연결하지 못했어요." };
    // 파일 이름은 제목의 로마자 + 시각 (실제 페이지 주소는 서버가 겹치지 않게 따로 정한다)
    const inst = String(fd.get("instrument") || "etc");
    const name = `${slugify(String(fd.get("title") ?? ""), 60) || "score"}-${Date.now().toString(36)}`;
    const path = `${inst}/${name}.pdf`;
    const { error } = await supabase.storage.from("scores").upload(path, file, { contentType: "application/pdf", upsert: false });
    if (error) return { ok: false as const, message: "PDF 를 올리지 못했어요. 에디터 권한과 파일을 확인해 주세요." };
    fd.set("file_path", path);

    // 첫 페이지 미리보기: thumbnails 버킷의 scores/<악기>/<이름>.jpg — 실패해도 악보 등록은 그대로 진행
    const thumb = thumbJob.current ? await thumbJob.current : null;
    if (thumb) {
      const thumbPath = `scores/${inst}/${name}.jpg`;
      const { error: thumbError } = await supabase.storage.from("thumbnails").upload(thumbPath, thumb, { contentType: "image/jpeg", upsert: false });
      if (!thumbError) fd.set("thumbnail_path", thumbPath);
    }
    return { ok: true as const, fd };
  }

  return (
    <WriteFormShell action={submitScore} mode={mode} submitLabel="악보 등록" resetHref="/score" prepare={prepare}>
      {({ values, errors }) => (
        <>
          <TextField name="title" label="곡 제목" required maxLength={LIMITS.title} defaultValue={values.title} error={errors.title} placeholder="예) 캐논 변주곡 (쉬운 편곡)" />
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField
              name="instrument"
              label="악기"
              required
              value={instrument || values.instrument || ""}
              onChange={setInstrument}
              error={errors.instrument}
              options={Object.entries(SCORE_INSTRUMENTS).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              name="difficulty"
              label="난이도"
              required
              defaultValue={values.difficulty}
              error={errors.difficulty}
              options={Object.entries(DIFFICULTIES).map(([value, label]) => ({ value, label }))}
            />
            <SelectField name="genre" label="장르" defaultValue={values.genre} error={errors.genre} options={SCORE_GENRES.map((g) => ({ value: g, label: g }))} />
            <TextField name="artist" label="작곡가·아티스트" maxLength={60} defaultValue={values.artist} error={errors.artist} placeholder="예) 파헬벨" />
          </div>
          <TextArea
            name="meta_description"
            label="검색 설명"
            required
            rows={3}
            maxLength={LIMITS.meta}
            defaultValue={values.meta_description}
            error={errors.meta_description}
            hint={`검색 결과에 보이는 한두 문장 (${LIMITS.meta}자 이하)`}
          />
          <PdfField mode={mode} error={errors.file} jobRef={thumbJob} />
          <p className="rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-ink-2">
            저작권이 만료된 곡, 직접 편곡·작성했거나 배포 허락을 받은 악보만 올려 주세요. 문제가 된 악보는 관리자가 내릴 수 있어요.
          </p>
        </>
      )}
    </WriteFormShell>
  );
}

/**
 * 악보 PDF 입력 + 첫 페이지 미리보기.
 * PDF 를 고르면 브라우저에서 첫 페이지를 JPEG 로 그려 보여 주고(pdf.js 는 이때 처음 불러온다),
 * 등록할 때 폼이 그 이미지를 thumbnails 버킷에 함께 올린다. 그리지 못해도 등록은 막지 않는다.
 * (폼을 다시 쓰면 WriteFormShell 이 이 부품을 새로 만들므로 미리보기도 함께 비워진다)
 */
function PdfField({ mode, error, jobRef }: { mode: "demo" | "supabase"; error?: string; jobRef: RefObject<ThumbJob> }) {
  const [thumb, setThumb] = useState<{ status: "idle" | "rendering" | "failed" } | { status: "ready"; url: string }>({ status: "idle" });
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    jobRef.current = null;
    return () => {
      jobRef.current = null;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [jobRef]);

  function onPick(file: File | undefined) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    if (!file || !isPdf(file) || file.size > MAX_PDF) {
      jobRef.current = null;
      setThumb({ status: "idle" });
      return;
    }
    setThumb({ status: "rendering" });
    const job: Promise<Blob | null> = import("@/lib/pdf-thumbnail")
      .then(({ renderPdfFirstPage }) => renderPdfFirstPage(file))
      .catch((e: unknown) => {
        console.warn("PDF 첫 페이지 미리보기를 만들지 못했어요 (썸네일 없이 등록):", e);
        return null;
      });
    jobRef.current = job;
    job.then((blob) => {
      if (jobRef.current !== job) return; // 그 사이 다른 파일을 골랐다
      if (!blob) return setThumb({ status: "failed" });
      urlRef.current = URL.createObjectURL(blob);
      setThumb({ status: "ready", url: urlRef.current });
    });
  }

  return (
    <FieldShell
      name="file"
      label="악보 PDF"
      required={mode === "supabase"}
      error={error}
      hint={
        mode === "demo"
          ? "데모 모드에서는 파일을 저장하지 않고 이름과 첫 페이지 미리보기만 확인해요."
          : "PDF, 20MB 이하. 등록하면 누구나 무료로 받을 수 있어요. 첫 페이지가 목록·상세의 미리보기 이미지가 돼요."
      }
    >
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-2 bg-paper px-4 py-4 text-sm text-ink-2 hover:border-ink-3">
        <FileUp aria-hidden className="size-5 shrink-0 text-ink-3" />
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => onPick(e.target.files?.[0])}
          className="min-w-0 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-paper"
        />
      </label>
      {thumb.status !== "idle" && (
        <div className="mt-3 flex items-start gap-3.5 rounded-xl bg-stone px-3.5 py-3" aria-live="polite" data-testid="score-thumb">
          <div className="flex aspect-[3/4] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-card sm:w-28">
            {thumb.status === "ready" ? (
              // eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 미리보기(blob URL)
              <img src={thumb.url} alt="고른 PDF 첫 페이지 미리보기" className="size-full object-cover object-top" />
            ) : thumb.status === "rendering" ? (
              <Loader2 aria-hidden className="size-5 animate-spin text-ink-3" />
            ) : (
              <ImageOff aria-hidden className="size-5 text-ink-3" />
            )}
          </div>
          <p className="pt-0.5 text-xs leading-relaxed text-ink-2">
            {thumb.status === "ready"
              ? "첫 페이지 미리보기예요. 등록하면 악보 목록과 상세 화면에 이 이미지가 보여요."
              : thumb.status === "rendering"
                ? "첫 페이지 미리보기를 만드는 중이에요…"
                : "미리보기를 만들지 못했어요. PDF 는 그대로 등록되고, 목록에는 기본 표시가 보여요."}
          </p>
        </div>
      )}
    </FieldShell>
  );
}
