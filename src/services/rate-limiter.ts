const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000; // 60 seconds

const timestamps: number[] = [];

export function checkRateLimit(): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  // Remove timestamps outside the window
  while (timestamps.length > 0 && timestamps[0] <= now - WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    const waitMs = WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, waitSeconds: Math.ceil(waitMs / 1000) };
  }
  timestamps.push(now);
  return { allowed: true, waitSeconds: 0 };
}

export function resetRateLimit(): void {
  timestamps.length = 0;
}
