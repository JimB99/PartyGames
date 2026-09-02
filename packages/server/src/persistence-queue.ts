/** Serialized, coalesced persistence writer for Durable Object storage. */
export class PersistenceQueue {
  private chain: Promise<void> = Promise.resolve();
  private dirty = false;
  private lastTransientWrite = 0;
  private transientThrottleMs: number;

  constructor(transientThrottleMs = 1000) {
    this.transientThrottleMs = transientThrottleMs;
  }

  markDirty(): void {
    this.dirty = true;
  }

  enqueueCritical(write: () => Promise<void>): Promise<void> {
    this.dirty = false;
    this.chain = this.chain.then(write).catch((err) => {
      console.error("Critical persistence failed:", err);
    });
    return this.chain;
  }

  enqueueTransient(write: () => Promise<void>, now = Date.now()): void {
    if (!this.dirty && now - this.lastTransientWrite < this.transientThrottleMs) return;
    this.dirty = false;
    this.lastTransientWrite = now;
    this.chain = this.chain.then(write).catch((err) => {
      console.error("Transient persistence failed:", err);
    });
  }

  async flush(): Promise<void> {
    await this.chain;
  }
}
