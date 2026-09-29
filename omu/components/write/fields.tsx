"use client";

import type { ReactNode } from "react";

// 글쓰기 폼 입력 부품 — 라벨·도움말·오류 문구를 aria 로 묶는다.

const inputBase =
  "w-full rounded-xl border bg-card px-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:border-ink-3 disabled:cursor-not-allowed disabled:bg-stone disabled:text-ink-3";

function describedBy(name: string, hint?: ReactNode, error?: string) {
  return [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function FieldShell({
  name,
  label,
  required,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="flex items-center gap-1 text-sm font-bold text-ink">
        {label}
        {required ? (
          <span className="text-coral-deep" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-ink-3">(선택)</span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs font-semibold text-coral-deep">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { name: string; label: string; required?: boolean; hint?: ReactNode; error?: string; defaultValue?: string };

export function TextField({
  type = "text",
  placeholder,
  maxLength,
  inputMode,
  min,
  max,
  disabled,
  value,
  onChange,
  ...c
}: Common & {
  type?: "text" | "url" | "date";
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text" | "url";
  min?: string;
  max?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <FieldShell {...c}>
      <input
        id={c.name}
        name={c.name}
        type={type}
        required={c.required}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        min={min}
        max={max}
        disabled={disabled}
        {...(value !== undefined ? { value, onChange: (e) => onChange?.(e.target.value) } : { defaultValue: c.defaultValue })}
        aria-invalid={c.error ? true : undefined}
        aria-describedby={describedBy(c.name, c.hint, c.error)}
        className={`${inputBase} h-11 ${c.error ? "border-coral" : "border-line-2"}`}
      />
    </FieldShell>
  );
}

export function TextArea({ rows = 8, placeholder, maxLength, ...c }: Common & { rows?: number; placeholder?: string; maxLength?: number }) {
  return (
    <FieldShell {...c}>
      <textarea
        id={c.name}
        name={c.name}
        rows={rows}
        required={c.required}
        placeholder={placeholder}
        maxLength={maxLength}
        defaultValue={c.defaultValue}
        aria-invalid={c.error ? true : undefined}
        aria-describedby={describedBy(c.name, c.hint, c.error)}
        className={`${inputBase} resize-y py-3 leading-relaxed ${c.error ? "border-coral" : "border-line-2"}`}
      />
    </FieldShell>
  );
}

export function SelectField({
  options,
  placeholder = "선택해 주세요",
  value,
  onChange,
  ...c
}: Common & { options: { value: string; label: string }[]; placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <FieldShell {...c}>
      <select
        id={c.name}
        name={c.name}
        required={c.required}
        {...(value !== undefined ? { value, onChange: (e) => onChange?.(e.target.value) } : { defaultValue: c.defaultValue ?? "" })}
        aria-invalid={c.error ? true : undefined}
        aria-describedby={describedBy(c.name, c.hint, c.error)}
        className={`${inputBase} h-11 ${c.error ? "border-coral" : "border-line-2"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** 라디오 버튼 묶음 (pill 모양) */
export function ChoiceField({
  name,
  label,
  required,
  hint,
  error,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  options: { value: string; label: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset aria-describedby={describedBy(name, hint, error)}>
      <legend className="flex items-center gap-1 text-sm font-bold text-ink">
        {label}
        {required ? (
          <span className="text-coral-deep" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-ink-3">(선택)</span>
        )}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const id = `${name}-${o.value || "none"}`;
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={`inline-flex cursor-pointer items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue ${
                checked ? "border-ink bg-ink text-paper" : "border-line-2 bg-card text-ink-2 hover:border-ink-3"
              }`}
            >
              <input id={id} type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs font-semibold text-coral-deep">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:text-ink-3">
        <input
          type="checkbox"
          name={name}
          disabled={disabled}
          {...(checked !== undefined ? { checked, onChange: (e) => onChange?.(e.target.checked) } : { defaultChecked })}
          aria-describedby={hint ? `${name}-hint` : undefined}
          className="size-4 accent-coral"
        />
        {label}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="mt-1 pl-6 text-xs text-ink-3">
          {hint}
        </p>
      )}
    </div>
  );
}
