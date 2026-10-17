/**
 * Historical wiring tables of the German military Enigma.
 * Sources: Crypto Museum, Wikipedia "Enigma rotor details".
 */

export type RotorId = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'
export type GreekRotorId = 'Beta' | 'Gamma'
export type ReflectorId = 'A' | 'B' | 'C' | 'B-thin' | 'C-thin'
export type ModelId = 'I' | 'M3' | 'M4'

export interface RotorSpec {
  wiring: string
  /** Letters shown in the window at which this rotor pushes its left neighbour. */
  notches: string
}

export const ROTORS: Record<RotorId | GreekRotorId, RotorSpec> = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notches: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notches: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notches: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notches: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notches: 'Z' },
  VI: { wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', notches: 'ZM' },
  VII: { wiring: 'NZJHGRCXMYSWBOUFAIVLPEKQDT', notches: 'ZM' },
  VIII: { wiring: 'FKQHTLXOCBJSPDZRAMEWNIUYGV', notches: 'ZM' },
  // Thin "Zusatzwalzen" of the M4: they never step.
  Beta: { wiring: 'LEYJVCNIXWPBQMDRTAKZGFUHOS', notches: '' },
  Gamma: { wiring: 'FSOKANUERHMBTIYCWLQPZXVGJD', notches: '' },
}

export const REFLECTORS: Record<ReflectorId, string> = {
  A: 'EJMZALYXVBWFCRQUONTSPIKHGD',
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
  'B-thin': 'ENKQAUYWJICOPBLMDXZVFTHRGS',
  'C-thin': 'RDOBJNTKVEHMLFCWZAXGYIPSUQ',
}

export interface ModelSpec {
  name: string
  /** Rotors that can go into the stepping positions. */
  rotors: readonly RotorId[]
  /** Thin rotors for the extra (leftmost, non-stepping) position, M4 only. */
  greekRotors: readonly GreekRotorId[]
  reflectors: readonly ReflectorId[]
  /** How the rotor rings are marked: Enigma I used 01–26, naval machines A–Z. */
  ringLabels: 'numbers' | 'letters'
}

export const MODELS: Record<ModelId, ModelSpec> = {
  I: {
    name: 'Enigma I (Wehrmacht / Luftwaffe)',
    rotors: ['I', 'II', 'III', 'IV', 'V'],
    greekRotors: [],
    reflectors: ['A', 'B', 'C'],
    ringLabels: 'numbers',
  },
  M3: {
    name: 'Enigma M3 (Kriegsmarine)',
    rotors: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'],
    greekRotors: [],
    reflectors: ['B', 'C'],
    ringLabels: 'letters',
  },
  M4: {
    name: 'Enigma M4 (U-Boote)',
    rotors: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'],
    greekRotors: ['Beta', 'Gamma'],
    reflectors: ['B-thin', 'C-thin'],
    ringLabels: 'letters',
  },
}

/** Maximum number of plugboard cables (13 pairs = all 26 letters). */
export const MAX_PLUGBOARD_PAIRS = 13
