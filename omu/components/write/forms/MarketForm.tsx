"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { ITEM_CONDITIONS, MARKET_CATEGORIES, REGIONS, TRADE_TYPES } from "@/lib/site";
import { submitMarket } from "@/lib/write/actions";
import { LIMITS } from "@/lib/write/validate";
import { ChoiceField, SelectField, TextArea, TextField } from "../fields";
import { WriteFormShell } from "../WriteFormShell";

export function MarketForm({ mode, defaults }: { mode: "demo" | "supabase"; defaults: { trade?: string; category?: string } }) {
  return (
    <WriteFormShell action={submitMarket} mode={mode} submitLabel="등록하기" resetHref="/gear/market">
      {({ values, errors }) => <Fields values={values} errors={errors} defaults={defaults} />}
    </WriteFormShell>
  );
}

function Fields({
  values,
  errors,
  defaults,
}: {
  values: Record<string, string | undefined>;
  errors: Record<string, string>;
  defaults: { trade?: string; category?: string };
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
      <div className="rounded-xl border border-dashed border-line-2 px-4 py-4 text-sm text-ink-3">
        <p className="flex items-center gap-2 font-semibold text-ink-2">
          <ImagePlus aria-hidden className="size-4" />
          사진 올리기
        </p>
        <p className="mt-1">사진 업로드는 다음 업데이트에서 열려요. 지금은 설명에 상태를 자세히 적어 주세요.</p>
      </div>
    </>
  );
}
