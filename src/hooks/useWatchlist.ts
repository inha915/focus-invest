"use client";

import { useCallback } from "react";

import {
  EMPTY_STRINGS,
  readLocal,
  toStringArray,
  useHydrated,
  useLocalValue,
  writeLocal,
} from "@/lib/client/local-store";
import { isSupportedCode } from "@/lib/stocks";

/** 관심 종목: localStorage에 종목코드 배열로 저장 */
export const WATCHLIST_KEY = "focus:watchlist";

function sanitize(v: unknown): string[] {
  const list = toStringArray(v).filter(isSupportedCode);
  return list.length ? list : EMPTY_STRINGS;
}

const current = () => readLocal(WATCHLIST_KEY, sanitize, EMPTY_STRINGS);

export function useWatchlist() {
  const codes = useLocalValue(WATCHLIST_KEY, sanitize, EMPTY_STRINGS);
  const hydrated = useHydrated();

  const has = useCallback((code: string) => codes.includes(code), [codes]);
  const add = useCallback((code: string) => {
    if (!current().includes(code)) writeLocal(WATCHLIST_KEY, [...current(), code]);
  }, []);
  const remove = useCallback((code: string) => {
    writeLocal(WATCHLIST_KEY, current().filter((c) => c !== code));
  }, []);
  const toggle = useCallback(
    (code: string) => (current().includes(code) ? remove(code) : add(code)),
    [add, remove],
  );
  const clear = useCallback(() => writeLocal(WATCHLIST_KEY, []), []);

  return { codes, hydrated, has, add, remove, toggle, clear };
}
