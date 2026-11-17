"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage 값을 React와 동기화하는 작은 저장소.
 * - useSyncExternalStore로 같은 탭의 여러 컴포넌트, 다른 브라우저 탭(storage 이벤트)을 동기화
 * - 서버 렌더/하이드레이션 중에는 empty 값을 돌려준다 (하이드레이션 불일치 방지)
 * - sanitize, empty는 모듈 수준 상수로 넘겨야 한다 (참조가 안정적이어야 함)
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();
// 저장소 제한/용량 초과 시 현재 탭에서만 유지하는 값 (null은 삭제).
const fallback = new Map<string, string | null>();

export function readLocal<T>(key: string, sanitize: (v: unknown) => T, empty: T): T {
  let raw: string | null = null;
  try {
    raw = fallback.has(key) ? fallback.get(key)! : window.localStorage.getItem(key);
  } catch {
    raw = cache.get(key)?.raw ?? null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value = empty;
  try {
    value = raw ? sanitize(JSON.parse(raw)) : empty;
  } catch {
    value = empty;
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeLocal<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
    fallback.delete(key);
  } catch {
    fallback.set(key, raw);
  }
  listeners.get(key)?.forEach((l) => l());
}

export function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key);
    fallback.delete(key);
  } catch {
    fallback.set(key, null);
  }
  listeners.get(key)?.forEach((l) => l());
}

export function useLocalValue<T>(key: string, sanitize: (v: unknown) => T, empty: T): T {
  const subscribe = useCallback(
    (listener: Listener) => {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );
  return useSyncExternalStore(
    subscribe,
    () => readLocal(key, sanitize, empty),
    () => empty,
  );
}

const noopSubscribe = () => () => {};

/** 클라이언트에서 저장소를 읽을 수 있게 된 뒤 true */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/* 자주 쓰는 sanitize 함수 */
export const EMPTY_STRINGS: string[] = [];
export function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : EMPTY_STRINGS;
}
