"use client";

import { SCORE_INSTRUMENTS } from "@/lib/site";
import { submitScoreRequest } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

export function ScoreRequestForm({ mode, defaults }: { mode: "demo" | "supabase"; defaults: { instrument?: string } }) {
  return (
    <WriteFormShell action={submitScoreRequest} mode={mode} submitLabel="요청하기" resetHref="/score/requests">
      {({ values, errors }) => (
        <>
          <TextField name="song_title" label="곡명" required maxLength={LIMITS.title} defaultValue={values.song_title} error={errors.song_title} placeholder="예) 캐논 변주곡 (중급 편곡)" />
          <SelectField
            name="instrument"
            label="악기"
            required
            defaultValue={values.instrument ?? defaults.instrument}
            error={errors.instrument}
            options={Object.entries(SCORE_INSTRUMENTS).map(([value, label]) => ({ value, label }))}
          />
          <TextArea
            name="description"
            label="자세한 요청"
            rows={5}
            maxLength={1000}
            defaultValue={values.description}
            error={errors.description}
            placeholder="원하는 편곡 난이도, 조성, 파트 등을 적어 주세요."
          />
          <p className="rounded-xl bg-stone px-4 py-3 text-xs leading-relaxed text-ink-2">
            저작권이 있는 곡은 무료 악보로 올리지 못할 수 있어요. 에디터가 확인 후 가능한 곡부터 올려드려요.
          </p>
        </>
      )}
    </WriteFormShell>
  );
}
