export const AMERICANO_COUNTS = [4, 6, 8]

export function parsePlayerIds(input: string) {
  const ids = input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
  return Array.from(new Set(ids), userId => ({ userId }))
}
