/** Personalize hot-seat prompt templates that use "Their/they" placeholders. */
export function personalizeHotSeatPrompt(prompt: string, name: string): string {
  const trimmed = prompt.trim();
  if (/^their\b/i.test(trimmed)) {
    return trimmed.replace(/^their\b/i, `${name}'s`);
  }
  if (/^what they'd\b/i.test(trimmed)) {
    return trimmed.replace(/^what they'd\b/i, `What would ${name}`);
  }
  if (/^what they're\b/i.test(trimmed)) {
    return trimmed.replace(/^what they're\b/i, `What is ${name}`);
  }
  if (/^have they\b/i.test(trimmed)) {
    return trimmed.replace(/^have they\b/i, `Has ${name}`);
  }
  if (/^do they\b/i.test(trimmed)) {
    return trimmed.replace(/^do they\b/i, `Does ${name}`);
  }
  if (/^would they\b/i.test(trimmed)) {
    return trimmed.replace(/^would they\b/i, `Would ${name}`);
  }
  return trimmed
    .replace(/\bthey'd\b/gi, `${name} would`)
    .replace(/\bthey're\b/gi, `${name} is`)
    .replace(/\btheir\b/gi, `${name}'s`)
    .replace(/\bthey\b/gi, name);
}
