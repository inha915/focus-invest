"use client";

import { useCallback, useEffect, useState } from "react";

import type { ApiErrorBody } from "@/lib/types";

export interface ClientApiError {
  message: string;
  code?: string;
  status?: number;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, cache: "no-store" });
  } catch (error) {
    if (signal.aborted) throw error;
    throw { message: "네트워크에 연결할 수 없습니다. 연결 상태를 확인해 주세요." } satisfies ClientApiError;
  }
  const body = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok || !body) {
    const err = (body as ApiErrorBody | null)?.error;
    throw {
      message: err?.message ?? `요청에 실패했습니다. (HTTP ${res.status})`,
      code: err?.code,
      status: res.status,
    } satisfies ClientApiError;
  }
  return body as T;
}

interface Result<T> {
  key: string;
  data?: T;
  error?: ClientApiError;
}

/**
 * GET JSON 로더. loading / error / retry를 제공한다.
 * `previous`는 마지막으로 성공한 데이터로, 기간 전환 중 화면 깜빡임을 줄이는 데 쓴다.
 */
export function useApi<T>(url: string | null) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const [previous, setPrevious] = useState<T | undefined>(undefined);
  const key = url ? `${url}#${nonce}` : null;

  useEffect(() => {
    if (!url || !key) return;
    const controller = new AbortController();
    fetchJson<T>(url, controller.signal).then(
      (data) => {
        setResult({ key, data });
        setPrevious(data);
      },
      (error: ClientApiError) => {
        if (!controller.signal.aborted) setResult({ key, error });
      },
    );
    return () => controller.abort();
  }, [url, key]);

  const settled = result !== null && result.key === key;
  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: settled ? result.data : undefined,
    error: settled ? result.error : undefined,
    loading: key !== null && !settled,
    previous,
    retry,
  };
}
