import { ALPHABET_SIZE, toIndex } from './alphabet'
import { MAX_PLUGBOARD_PAIRS } from './data'

/** A cable joining two sockets, written as two letters: "AV". */
export type PlugPair = string

export function validatePlugboard(pairs: readonly PlugPair[]): void {
  if (pairs.length > MAX_PLUGBOARD_PAIRS) {
    throw new RangeError(`At most ${MAX_PLUGBOARD_PAIRS} cables fit the plugboard`)
  }
  const used = new Set<number>()
  for (const pair of pairs) {
    if (pair.length !== 2) throw new RangeError(`Invalid cable "${pair}"`)
    const [a, b] = [toIndex(pair[0]), toIndex(pair[1])]
    if (a === b) throw new RangeError(`A cable cannot join "${pair[0]}" to itself`)
    for (const socket of [a, b]) {
      if (used.has(socket)) throw new RangeError(`Socket used twice in "${pair}"`)
      used.add(socket)
    }
  }
}

/** Builds the (involutive) permutation implemented by the cables. */
export function plugboardPermutation(pairs: readonly PlugPair[]): number[] {
  const permutation = Array.from({ length: ALPHABET_SIZE }, (_, i) => i)
  for (const pair of pairs) {
    const [a, b] = [toIndex(pair[0]), toIndex(pair[1])]
    permutation[a] = b
    permutation[b] = a
  }
  return permutation
}
