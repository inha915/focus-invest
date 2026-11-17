"use client";

import { useCallback } from "react";

import { EMPTY_STRINGS, readLocal, toStringArray, useLocalValue, writeLocal } from "@/lib/client/local-store";
import { isSupportedCode } from "@/lib/stocks";

/** 최근 본 종목 (최신순, 최대 10개) */
const KEY = "focus:recent";
const MAX = 10;

function sanitize(v: unknown): string[] {
  const list = toStringArray(v).filter(isSupportedCode).slice(0, MAX);
  return list.length ? list : EMPTY_STRINGS;
}

export function recordRecentStock(code: string) {
  const list = readLocal(KEY, sanitize, EMPTY_STRINGS);
  if (list[0] === code) return;
  writeLocal(KEY, [code, ...list.filter((c) => c !== code)].slice(0, MAX));
}

export function useRecentStocks() {
  const codes = useLocalValue(KEY, sanitize, EMPTY_STRINGS);
  const clear = useCallback(() => writeLocal(KEY, []), []);
  return { codes, clear };
}
