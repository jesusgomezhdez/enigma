export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const ALPHABET_SIZE = 26

export type Letter = string

export function mod(n: number, m: number = ALPHABET_SIZE): number {
  return ((n % m) + m) % m
}

export function toIndex(letter: Letter): number {
  const index = ALPHABET.indexOf(letter.toUpperCase())
  if (index === -1 || letter.length !== 1) {
    throw new RangeError(`Not a letter A-Z: "${letter}"`)
  }
  return index
}

export function toLetter(index: number): Letter {
  return ALPHABET[mod(index)]
}

export function isLetter(value: string): boolean {
  return value.length === 1 && ALPHABET.includes(value.toUpperCase())
}

/** Converts a wiring string ("EKMF...") into an index permutation. */
export function toPermutation(wiring: string): number[] {
  return [...wiring].map(toIndex)
}

export function invert(permutation: readonly number[]): number[] {
  const inverse = new Array<number>(permutation.length)
  permutation.forEach((to, from) => {
    inverse[to] = from
  })
  return inverse
}

/** What the window shows: "01"–"26" on the Enigma I, "A"–"Z" on naval machines. */
export function formatRingLabel(index: number, style: 'numbers' | 'letters'): string {
  return style === 'numbers' ? String(mod(index) + 1).padStart(2, '0') : toLetter(index)
}
