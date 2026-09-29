"use client";

import { useState } from "react";
import { RECRUIT_CATEGORIES, RECRUIT_LEVELS, REGIONS, SKILL_LEVELS, type RecruitLevel } from "@/lib/site";
import { submitRecruit } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { LevelBadge } from "../../ui";
import { ChoiceField, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

export function RecruitForm({ mode, defaults, today }: { mode: "demo" | "supabase"; defaults: { category?: string }; today: string }) {
  return (
    <WriteFormShell action={submitRecruit} mode={mode} submitLabel="등록하기" resetHref="/recruit">
      {({ values, errors }) => <Fields values={values} errors={errors} defaults={defaults} today={today} />}
    </WriteFormShell>
  );
}

function Fields({
  values,
  errors,
  defaults,
  today,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  defaults: { category?: string };
  today: string;
}) {
  const [category, setCategory] = useState(values.category ?? defaults.category ?? "band");
  const [level, setLevel] = useState(values.recruit_level ?? "");
  const isBand = category === "band";

  return (
    <>
      <ChoiceField
        name="category"
        label="모집 유형"
        required
        value={category}
        onChange={setCategory}
        error={errors.category}
        options={Object.entries(RECRUIT_CATEGORIES).map(([value, label]) => ({ value, label }))}
      />
      <ChoiceField
        name="recruit_level"
        label="모집 성격"
        required={isBand}
        value={level}
        onChange={setLevel}
        error={errors.recruit_level}
        hint={isBand ? "밴드 모집은 꼭 골라 주세요. 목록에서 색깔 배지로 보여요." : "해당되면 골라 주세요."}
        options={[
          ...(isBand ? [] : [{ value: "", label: "선택 안 함" }]),
          ...(Object.keys(RECRUIT_LEVELS) as RecruitLevel[]).map((l) => ({ value: l, label: <LevelBadge level={l} /> })),
        ]}
      />
      <TextField name="title" label="제목" required maxLength={LIMITS.title} defaultValue={values.title} error={errors.title} placeholder="예) 직장인 주말 밴드, 드러머 모셔요" />
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          name="region"
          label="지역"
          required
          defaultValue={values.region}
          error={errors.region}
          hint="비대면이면 ‘온라인’을 골라 주세요."
          options={REGIONS.map((r) => ({ value: r, label: r === "온라인" ? "온라인(비대면)" : r }))}
        />
        <TextField
          name="deadline"
          label="마감일"
          type="date"
          min={today}
          defaultValue={values.deadline}
          error={errors.deadline}
          hint="비워 두면 ‘상시 모집’으로 보여요."
        />
      </div>
      <TextField
        name="positions"
        label="모집 역할"
        defaultValue={values.positions}
        error={errors.positions}
        hint={`쉼표로 구분해 ${LIMITS.positions}개까지 (예: 드럼, 베이스)`}
        placeholder="드럼, 베이스"
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="genre" label="장르" maxLength={30} defaultValue={values.genre} error={errors.genre} placeholder="예) 모던락" />
        <SelectField
          name="skill_level"
          label="원하는 실력"
          placeholder="무관"
          defaultValue={values.skill_level}
          error={errors.skill_level}
          options={Object.entries(SKILL_LEVELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <TextArea
        name="description"
        label="설명"
        required
        rows={8}
        maxLength={LIMITS.description}
        defaultValue={values.description}
        error={errors.description}
        placeholder="팀 소개, 활동 일정, 합주 장소, 지원 방법 등을 적어 주세요."
      />
      <TextField
        name="contact"
        label="연락 안내"
        maxLength={LIMITS.contact}
        defaultValue={values.contact}
        error={errors.contact}
        hint="개인 연락처는 꼭 필요할 때만 적어 주세요. ‘댓글로 지원’을 권장해요."
        placeholder="예) 댓글로 합주 영상 링크 남겨 주세요"
      />
    </>
  );
}
