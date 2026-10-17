/**
 * Real-world proportions of an Enigma I, in centimetres (1 scene unit = 1 cm).
 * The operator sits on +z looking towards -z.
 */

export const KEY_ROWS = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'] as const

export const CASE = { width: 34, depth: 30, height: 13, wall: 1, lidThickness: 1.4 }

/** Height of the black top plate (Deckplatte) that carries keys and lamps. */
export const PLATE_Y = 10

export const KEYBOARD = { pitch: 3.1, rowsZ: [4.6, 7.7, 10.8], capRadius: 0.85, capHeight: 2, travel: 0.7 }

export const LAMPBOARD = { pitch: 2.9, rowsZ: [-6.9, -4.2, -1.5], windowRadius: 0.75, height: 0.7 }

export const ROTOR_HOUSING = { width: 15, zFront: -9.4, zBack: -13.8, height: 2.6, windowPitch: 3.6 }

export interface GridCell {
  letter: string
  x: number
  z: number
}

/** Lays the QWERTZ rows out centred on x = 0, like the keyboard and the lampboard. */
export function qwertzGrid(rowsZ: readonly number[], pitch: number): GridCell[] {
  return KEY_ROWS.flatMap((row, r) =>
    [...row].map((letter, i) => ({ letter, x: (i - (row.length - 1) / 2) * pitch, z: rowsZ[r] })),
  )
}
