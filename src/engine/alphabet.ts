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
