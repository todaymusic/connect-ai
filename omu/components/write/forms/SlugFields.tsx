"use client";

import { useState } from "react";
import { slugify } from "@/lib/slug";
import { LIMITS } from "@/lib/write/validate";
import { TextField } from "../fields";

/** 제목 + 주소(slug) — 제목을 치면 로마자 주소가 자동으로 채워지고, 직접 고치면 그때부터는 따라가지 않는다 */
export function TitleSlugFields({
  titleLabel,
  pathPrefix,
  values,
  errors,
  placeholder,
}: {
  titleLabel: string;
  pathPrefix: string;
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  placeholder?: string;
}) {
  const [title, setTitle] = useState(values.title ?? "");
  const [slug, setSlug] = useState(values.slug ?? "");
  const [touched, setTouched] = useState(Boolean(values.slug));

  return (
    <>
      <TextField
        name="title"
        label={titleLabel}
        required
        maxLength={LIMITS.title}
        value={title}
        onChange={(v) => {
          setTitle(v);
          if (!touched) setSlug(slugify(v));
        }}
        error={errors.title}
        placeholder={placeholder}
      />
      <TextField
        name="slug"
        label="주소(slug)"
        required
        maxLength={80}
        value={slug}
        onChange={(v) => {
          setTouched(true);
          setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
        }}
        error={errors.slug}
        hint={
          <>
            검색에 쓰이는 주소예요. 영문 소문자·숫자·하이픈만. 미리보기: <span className="font-display text-ink-2">{pathPrefix}/{slug || "…"}</span>
          </>
        }
      />
    </>
  );
}
