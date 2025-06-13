/** DJB2 hash → base36 */
export function hashSignature(sig: string): string {
  let h = 5381;
  for (let i = 0; i < sig.length; i++) h = (h * 33) ^ sig.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** Convert camelCase to kebab-case */
export function toKebab(s: string): string {
  return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function isObject(v: unknown): boolean {
  return typeof v === "object";
}
