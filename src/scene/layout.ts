/**
 * Real-world proportions of an Enigma I, in centimetres (1 scene unit = 1 cm).
 * The operator sits on +z looking towards -z.
 */

export const KEY_ROWS = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'] as const

export const CASE = { width: 34, depth: 30, height: 13, wall: 1, lidThickness: 1.4 }

/** Height of the black top plate (Deckplatte) that carries keys and lamps. */
export const PLATE_Y = 10

export const KEYBOARD = { pitch: 3.1, rowsZ: [5, 8.1, 11.2], capRadius: 0.85, capHeight: 2, travel: 0.7 }

export const LAMPBOARD = { pitch: 2.9, rowsZ: [-5.6, -2.9, -0.2], windowRadius: 0.75, height: 0.7 }

/**
 * Steckerbrett on the front face of the machine, below the keyboard. The case's front flap
 * folds down to reach it; cables live in the recess between the panel and the flap.
 */
export const PLUGBOARD = { z: 12.6, rowsY: [8.1, 5.6, 3.1], pitch: 3.1, socketRadius: 0.55, socketDepth: 0.15, plugLength: 0.6 }

/** Front face of a plugged-in plug: where cables leave and where dragging happens. */
export const PLUG_FRONT_Z = PLUGBOARD.z + PLUGBOARD.socketDepth + PLUGBOARD.plugLength

export const FLAP = { openAngle: 1.62 }

export const ROTOR_HOUSING = { width: 15, zFront: -7.4, zBack: -14, height: 1, wall: 0.2, lidThickness: 0.15, windowPitch: 3.6 }

/**
 * A rotor turns on an axle running left to right (x), below the top plate as in the real machine:
 * only the crown of the alphabet ring reaches the window, and the thumbwheel on its right pokes
 * through a slot in the inner lid.
 */
export const ROTOR = {
  axleY: 8,
  ringRadius: 2.95,
  ringWidth: 1.7,
  coreRadius: 2.7,
  coreWidth: 2.3,
  wheelRadius: 3.7,
  wheelWidth: 0.45,
  wheelOffset: 1.35,
  teeth: 26,
}

export const ROTOR_STEP_ANGLE = (Math.PI * 2) / 26

/** x of the window (and ring) of a rotor slot, centred under the inner lid. */
export function rotorX(slot: number, count: number): number {
  return (slot - (count - 1) / 2) * ROTOR_HOUSING.windowPitch
}

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
