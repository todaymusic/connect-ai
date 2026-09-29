"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { IMAGE_TYPES, LIMITS } from "@/lib/write/validate";

export type PickedImage = { id: string; file: File; url: string };

const MB = 1024 * 1024;
const ACCEPT = IMAGE_TYPES.join(",");

/**
 * 장터 사진 고르기 — 형식·용량·개수를 바로 확인하고 미리보기를 보여 준다.
 * 파일은 여기서 올리지 않는다. 제출할 때 폼(prepare)이 Storage 에 올린다(데모는 미리보기만).
 */
export function ImagePicker({ onChange, error }: { onChange: (files: File[]) => void; error?: string }) {
  const id = useId();
  const [items, setItems] = useState<PickedImage[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const seq = useRef(0);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });

  // 새로 열릴 때(‘하나 더 쓰기’ 포함) 부모가 들고 있는 파일 목록을 비우고, 떠날 때 미리보기 주소 해제
  useEffect(() => {
    cb.current([]);
    const list = urls.current;
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function update(next: PickedImage[]) {
    setItems(next);
    cb.current(next.map((i) => i.file));
  }

  function add(list: FileList | null) {
    if (!list) return;
    const problems: string[] = [];
    const next = [...items];
    for (const file of Array.from(list)) {
      if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
        problems.push(`${file.name}: JPG·PNG·WEBP·GIF 만 올릴 수 있어요.`);
        continue;
      }
      if (file.size > LIMITS.imageBytes) {
        problems.push(`${file.name}: ${LIMITS.imageBytes / MB}MB 이하만 올릴 수 있어요.`);
        continue;
      }
      if (next.length >= LIMITS.images) {
        problems.push(`사진은 ${LIMITS.images}장까지예요.`);
        break;
      }
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      seq.current += 1;
      next.push({ id: `${seq.current}-${file.name}-${file.size}`, file, url });
    }
    setMessage(problems.length ? problems.join(" ") : null);
    update(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(target: PickedImage) {
    URL.revokeObjectURL(target.url);
    const at = urls.current.indexOf(target.url);
    if (at >= 0) urls.current.splice(at, 1);
    update(items.filter((i) => i.id !== target.id));
    setMessage(null);
  }

  const shown = message ?? error;
  return (
    <div>
      <p id={`${id}-label`} className="text-sm font-bold text-ink">
        사진 <span className="font-normal text-ink-3">(선택)</span>
      </p>
      <p id={`${id}-hint`} className="mt-1 text-xs text-ink-3">
        JPG·PNG·WEBP·GIF, 한 장 {LIMITS.imageBytes / MB}MB 이하, 최대 {LIMITS.images}장. 첫 사진이 목록 대표 사진이 돼요.
      </p>
      <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-labelledby={`${id}-label`}>
        {items.map((it, i) => (
          <li key={it.id} className="relative aspect-square overflow-hidden rounded-xl bg-stone">
            {/* eslint-disable-next-line @next/next/no-img-element -- 브라우저 미리보기(object URL) */}
            <img src={it.url} alt={`고른 사진 ${i + 1}`} className="size-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 text-[10px] font-bold text-paper">대표</span>}
            <button
              type="button"
              onClick={() => remove(it)}
              aria-label={`사진 ${i + 1} 빼기`}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-ink/75 text-paper hover:bg-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </li>
        ))}
        {items.length < LIMITS.images && (
          <li>
            <label
              htmlFor={`${id}-file`}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-2 bg-paper text-ink-3 hover:border-ink-3 hover:text-ink"
            >
              <ImagePlus aria-hidden className="size-5" />
              <span className="text-[11px] font-semibold">
                {items.length}/{LIMITS.images}
              </span>
              <span className="sr-only">사진 추가</span>
            </label>
            <input
              ref={inputRef}
              id={`${id}-file`}
              type="file"
              accept={ACCEPT}
              multiple
              onChange={(e) => add(e.target.files)}
              aria-describedby={`${id}-hint`}
              className="sr-only"
              data-testid="market-photos"
            />
          </li>
        )}
      </ul>
      {shown && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-coral-deep">
          {shown}
        </p>
      )}
    </div>
  );
}

/** 데모 보관용 작은 썸네일(data URL, 240px) — localStorage 용량을 아끼기 위해 줄여서 저장 */
export async function makeThumbnail(file: File, size = 240): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}
