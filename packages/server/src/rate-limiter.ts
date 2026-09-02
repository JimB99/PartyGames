/** Token-bucket rate limiter per connection. */
export class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private readonly key: string,
    private readonly ratePerSec: number,
    private readonly burst: number,
  ) {}

  private bucket(id: string) {
    let b = this.buckets.get(id);
    if (!b) {
      b = { tokens: this.burst, lastRefill: Date.now() };
      this.buckets.set(id, b);
    }
    return b;
  }

  tryConsume(connectionId: string, cost = 1): boolean {
    const b = this.bucket(connectionId);
    const now = Date.now();
    const elapsed = (now - b.lastRefill) / 1000;
    b.tokens = Math.min(this.burst, b.tokens + elapsed * this.ratePerSec);
    b.lastRefill = now;
    if (b.tokens < cost) return false;
    b.tokens -= cost;
    return true;
  }

  reset(connectionId: string): void {
    this.buckets.delete(connectionId);
  }
}

export const actionLimiter = new RateLimiter("action", 8, 16);
export const drawLimiter = new RateLimiter("draw", 30, 60);
export const hostAdminLimiter = new RateLimiter("host", 4, 8);
