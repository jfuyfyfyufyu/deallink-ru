/**
 * Async safety utilities — timeouts, safe queries, debounced invalidation.
 */

/** Race a promise against a timeout. Rejects with Error('timeout') if ms exceeded. */
export function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

/** Run an async fn, return fallback on any error (timeout, network, etc). Logs to console. */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  label = 'safeAsync',
  timeoutMs = 10000
): Promise<T> {
  try {
    return await withTimeout(fn(), timeoutMs);
  } catch (e) {
    console.warn(`[${label}] failed, using fallback:`, e);
    return fallback;
  }
}

/** Debounced batch invalidation for React Query. */
export function createDebouncedInvalidator(delayMs = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const pending = new Set<string>();

  return {
    add(key: string) {
      pending.add(key);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const keys = [...pending];
        pending.clear();
        timer = null;
        // Return keys for caller to invalidate
        this._flush?.(keys);
      }, delayMs);
    },
    onFlush(cb: (keys: string[]) => void) {
      this._flush = cb;
    },
    _flush: null as ((keys: string[]) => void) | null,
  };
}
