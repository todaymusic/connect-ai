"use client";

import { useCallback, useRef, useState } from "react";
import { ITEM_CONDITIONS, MARKET_CATEGORIES, REGIONS, TRADE_TYPES } from "@/lib/site";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitMarket, type DemoRecord } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { ChoiceField, SelectField, TextArea, TextField } from "../fields";
import { ImagePicker, makeThumbnail } from "../ImagePicker";
import { WriteFormShell } from "../WriteFormShell";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export function MarketForm({ mode, defaults }: { mode: "demo" | "supabase"; defaults: { trade?: string; category?: string } }) {
  const files = useRef<File[]>([]);
  const thumbs = useRef<string[]>([]);

  /**
   * 제출 전: 사진 처리
   *  - Supabase: 브라우저에서 market 버킷의 '본인 uid/' 폴더로 올리고 경로만 서버로 보낸다(서버 액션 본문 한도 회피)
   *  - 데모: 올리지 않고 작은 썸네일만 만들어 이 브라우저에 보관한다
   */
  async function prepare(fd: FormData) {
    const list = files.current;
    if (list.length === 0) return { ok: true as const, fd };
    if (mode === "demo") {
      thumbs.current = (await Promise.all(list.map((f) => makeThumbnail(f)))).filter((t): t is string => Boolean(t));
      fd.set("images", JSON.stringify(list.map((f, i) => `photo-${i + 1}.${EXT[f.type] ?? "jpg"}`)));
      return { ok: true as const, fd };
    }
    const supabase = getSupabaseBrowserClient();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    const uid = data.user?.id;
    if (!supabase || !uid) return { ok: false as const, message: "사진을 올리려면 다시 로그인해 주세요." };
    const stamp = Date.now().toString(36);
    const paths: string[] = [];
    for (const [i, f] of list.entries()) {
      const path = `${uid}/${stamp}-${i + 1}.${EXT[f.type] ?? "jpg"}`;
      const { error } = await supabase.storage.from("market").upload(path, f, { contentType: f.type, upsert: false });
      if (error) return { ok: false as const, message: `사진 ${i + 1}을 올리지 못했어요. 형식(JPG·PNG·WEBP·GIF)과 용량(10MB 이하)을 확인해 주세요.` };
      paths.push(path);
    }
    fd.set("images", JSON.stringify(paths));
    return { ok: true as const, fd };
  }

  const decorateDemo = useCallback((r: DemoRecord): DemoRecord => (thumbs.current.length ? { ...r, images: thumbs.current } : r), []);

  return (
    <WriteFormShell action={submitMarket} mode={mode} submitLabel="등록하기" resetHref="/gear/market" prepare={prepare} decorateDemo={decorateDemo}>
      {({ values, errors }) => (
        <Fields
          values={values}
          errors={errors}
          defaults={defaults}
          mode={mode}
          onFiles={(f) => {
            files.current = f;
          }}
        />
      )}
    </WriteFormShell>
  );
}

function Fields({
  values,
  errors,
  defaults,
  mode,
  onFiles,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  defaults: { trade?: string; category?: string };
  mode: "demo" | "supabase";
  onFiles: (files: File[]) => void;
}) {
  const [trade, setTrade] = useState(values.trade_type ?? defaults.trade ?? "sell");
  const isShare = trade === "share";
  const isBuy = trade === "buy";

  return (
    <>
      <ChoiceField
        name="trade_type"
        label="거래 방식"
        required
        value={trade}
        onChange={setTrade}
        error={errors.trade_type}
        options={Object.entries(TRADE_TYPES).map(([value, label]) => ({ value, label }))}
        hint="OMU 중고 장터는 직거래 중심이에요. 안전결제(에스크로)는 아직 지원하지 않아요."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          name="category"
          label="종류"
          required
          defaultValue={values.category ?? defaults.category}
          error={errors.category}
          options={Object.entries(MARKET_CATEGORIES).map(([value, label]) => ({ value, label }))}
        />
        <SelectField name="region" label="지역" required defaultValue={values.region} error={errors.region} options={REGIONS.map((r) => ({ value: r, label: r }))} />
      </div>
      <TextField
        name="title"
        label="제목"
        required
        maxLength={LIMITS.title}
        defaultValue={values.title}
        error={errors.title}
        placeholder={isBuy ? "예) 오디오 인터페이스 2in2 구해요" : "예) 야마하 디지털피아노 P-125"}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {isShare ? (
          <div>
            <p className="text-sm font-bold text-ink">가격</p>
            <p className="mt-1.5 flex h-11 items-center rounded-xl bg-stone px-3.5 text-[15px] font-semibold text-blue">무료 나눔</p>
          </div>
        ) : (
          <TextField
            name="price"
            label={isBuy ? "희망 가격(원)" : "가격(원)"}
            required
            inputMode="numeric"
            defaultValue={values.price}
            error={errors.price}
            placeholder="예) 250000"
          />
        )}
        {!isBuy && (
          <SelectField
            name="item_condition"
            label="물건 상태"
            required={trade === "sell"}
            defaultValue={values.item_condition}
            error={errors.item_condition}
            options={Object.entries(ITEM_CONDITIONS).map(([value, label]) => ({ value, label }))}
          />
        )}
      </div>
      <TextArea
        name="description"
        label="설명"
        required
        rows={8}
        maxLength={LIMITS.description}
        defaultValue={values.description}
        error={errors.description}
        placeholder="사용 기간, 구성품, 하자 여부, 거래 가능 시간 등을 적어 주세요."
      />
      <TextField
        name="contact"
        label="연락 안내"
        maxLength={LIMITS.contact}
        defaultValue={values.contact}
        error={errors.contact}
        hint="전화번호 대신 ‘댓글로 문의’, 오픈채팅 링크, 연락 가능 시간 등을 권장해요."
        placeholder="예) 댓글 주시면 연락드려요. 평일 저녁 가능"
      />
      <ImagePicker onChange={onFiles} error={errors.images} />
      {mode === "demo" && <p className="-mt-3 text-xs text-ink-3">데모 모드에서는 사진을 서버에 올리지 않고 이 브라우저에서 미리보기만 해요.</p>}
    </>
  );
}
