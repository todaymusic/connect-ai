"use client";

import { FileUp } from "lucide-react";
import { useState } from "react";
import { DIFFICULTIES, SCORE_GENRES, SCORE_INSTRUMENTS } from "@/lib/site";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitScore } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { FieldShell, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";
import { TitleSlugFields } from "./SlugFields";

const MAX_PDF = 20 * 1024 * 1024; // schema.sql 의 scores 버킷 한도와 같다

export function ScoreForm({ mode }: { mode: "demo" | "supabase" }) {
  const [instrument, setInstrument] = useState("");

  /** 제출 전: PDF 를 브라우저에서 Storage 로 먼저 올리고 경로만 서버로 보낸다(서버 액션 본문 한도 회피) */
  async function prepare(fd: FormData) {
    const file = fd.get("file");
    fd.delete("file");
    const hasFile = file instanceof File && file.size > 0;
    if (hasFile) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return { ok: false as const, message: "PDF 파일만 올릴 수 있어요." };
      if (file.size > MAX_PDF) return { ok: false as const, message: "PDF 는 20MB 이하만 올릴 수 있어요." };
      fd.set("file_name", file.name);
    }
    if (mode === "demo" || !hasFile) return { ok: true as const, fd }; // 데모는 파일을 저장하지 않는다

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { ok: false as const, message: "스토리지에 연결하지 못했어요." };
    const slug = String(fd.get("slug") || "score");
    const inst = String(fd.get("instrument") || "etc");
    const path = `${inst}/${slug}-${Date.now().toString(36)}.pdf`;
    const { error } = await supabase.storage.from("scores").upload(path, file, { contentType: "application/pdf", upsert: false });
    if (error) return { ok: false as const, message: "PDF 를 올리지 못했어요. 에디터 권한과 파일을 확인해 주세요." };
    fd.set("file_path", path);
    return { ok: true as const, fd };
  }

  return (
    <WriteFormShell action={submitScore} mode={mode} submitLabel="악보 등록" resetHref="/score" prepare={prepare}>
      {({ values, errors }) => (
        <>
          <TitleSlugFields
            titleLabel="곡 제목"
            pathPrefix={`/score/${instrument || values.instrument || "악기"}`}
            values={values}
            errors={errors}
            placeholder="예) 캐논 변주곡 (쉬운 편곡)"
          />
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
          <FieldShell
            name="file"
            label="악보 PDF"
            required={mode === "supabase"}
            error={errors.file}
            hint={mode === "demo" ? "데모 모드에서는 파일을 저장하지 않고 이름만 확인해요." : "PDF, 20MB 이하. 등록하면 누구나 무료로 받을 수 있어요."}
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-2 bg-paper px-4 py-4 text-sm text-ink-2 hover:border-ink-3">
              <FileUp aria-hidden className="size-5 shrink-0 text-ink-3" />
              <input id="file" name="file" type="file" accept="application/pdf,.pdf" className="min-w-0 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-paper" />
            </label>
          </FieldShell>
          <p className="rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-ink-2">
            저작권이 만료된 곡, 직접 편곡·작성했거나 배포 허락을 받은 악보만 올려 주세요. 문제가 된 악보는 관리자가 내릴 수 있어요.
          </p>
        </>
      )}
    </WriteFormShell>
  );
}
