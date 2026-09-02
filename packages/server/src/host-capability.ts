/** Mint and verify host capability tokens (stored server-side, sent once on host join). */
export function mintHostToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function verifyHostToken(stored: string | null, provided: string | undefined): boolean {
  if (!stored || !provided) return false;
  if (stored.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < stored.length; i++) {
    diff |= stored.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}
