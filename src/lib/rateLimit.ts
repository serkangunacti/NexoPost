type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __nexopostRateLimit?: Map<string, RateLimitEntry>;
};

const store = globalStore.__nexopostRateLimit ?? new Map<string, RateLimitEntry>();

if (!globalStore.__nexopostRateLimit) {
  globalStore.__nexopostRateLimit = store;
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return {
      ok: true,
      remaining: limit - 1,
      resetAt: next.resetAt,
    };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    ok: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}
