import { invert, isLetter, mod, toIndex, toLetter, toPermutation, type Letter } from './alphabet'
import {
  MODELS,
  REFLECTORS,
  ROTORS,
  type GreekRotorId,
  type ModelId,
  type ReflectorId,
  type RotorId,
} from './data'
import { plugboardPermutation, validatePlugboard, type PlugPair } from './plugboard'

export interface RotorSetting {
  id: RotorId | GreekRotorId
  /** Ringstellung, 0–25 (0 = "A" / "01"). */
  ring: number
  /** Letter in the window, 0–25. */
  position: number
}

export interface MachineState {
  model: ModelId
  reflector: ReflectorId
  /** Ordered left to right, as seen by the operator. M4: index 0 is the thin rotor. */
  rotors: readonly RotorSetting[]
  plugboard: readonly PlugPair[]
}

export type TraceComponent = 'plugboard' | 'entry' | 'rotor' | 'reflector'

/** One hop of the electrical signal, used to draw the current path. */
export interface TraceStep {
  component: TraceComponent
  /** Rotor slot (index in `rotors`), only for rotor hops. */
  slot?: number
  direction: 'in' | 'out'
  input: number
  output: number
}

export interface KeyPress {
  state: MachineState
  /** Lamp that lights up. */
  output: Letter
  trace: TraceStep[]
}

const rotorTables = Object.fromEntries(
  Object.entries(ROTORS).map(([id, spec]) => {
    const forward = toPermutation(spec.wiring)
    return [id, { forward, backward: invert(forward), notches: [...spec.notches].map(toIndex) }]
  }),
) as Record<RotorId | GreekRotorId, { forward: number[]; backward: number[]; notches: number[] }>

const reflectorTables = Object.fromEntries(
  Object.entries(REFLECTORS).map(([id, wiring]) => [id, toPermutation(wiring)]),
) as Record<ReflectorId, number[]>

export function validateMachine(state: MachineState): void {
  const model = MODELS[state.model]
  if (!model) throw new RangeError(`Unknown model "${state.model}"`)
  if (!model.reflectors.includes(state.reflector)) {
    throw new RangeError(`Reflector ${state.reflector} does not fit the ${model.name}`)
  }

  const expected = state.model === 'M4' ? 4 : 3
  if (state.rotors.length !== expected) {
    throw new RangeError(`The ${model.name} takes ${expected} rotors`)
  }

  const ids = state.rotors.map((rotor) => rotor.id)
  if (new Set(ids).size !== ids.length) throw new RangeError('Each rotor exists only once')

  state.rotors.forEach((rotor, slot) => {
    const isGreekSlot = state.model === 'M4' && slot === 0
    const allowed: readonly string[] = isGreekSlot ? model.greekRotors : model.rotors
    if (!allowed.includes(rotor.id)) {
      throw new RangeError(`Rotor ${rotor.id} does not fit slot ${slot} of the ${model.name}`)
    }
    for (const value of [rotor.ring, rotor.position]) {
      if (!Number.isInteger(value) || value < 0 || value > 25) {
        throw new RangeError(`Ring and position must be integers 0–25`)
      }
    }
  })

  validatePlugboard(state.plugboard)
}

export function createMachine(state: MachineState): MachineState {
  validateMachine(state)
  return state
}

function isAtNotch(rotor: RotorSetting): boolean {
  return rotorTables[rotor.id].notches.includes(rotor.position)
}

/**
 * Advances the rotors as the key travels down, before the contact closes.
 * Only the three rightmost rotors step. The middle rotor steps on its own notch
 * too, which produces the famous "double step".
 */
export function step(state: MachineState): MachineState {
  const count = state.rotors.length
  const [left, middle, right] = [count - 3, count - 2, count - 1]
  const middleAtNotch = isAtNotch(state.rotors[middle])
  const rightAtNotch = isAtNotch(state.rotors[right])

  const rotors = state.rotors.map((rotor, slot) => {
    const advances =
      slot === right ||
      (slot === middle && (rightAtNotch || middleAtNotch)) ||
      (slot === left && middleAtNotch)
    return advances ? { ...rotor, position: mod(rotor.position + 1) } : rotor
  })
  return { ...state, rotors }
}

function throughRotor(rotor: RotorSetting, input: number, table: 'forward' | 'backward'): number {
  const shift = rotor.position - rotor.ring
  return mod(rotorTables[rotor.id][table][mod(input + shift)] - shift)
}

/** Sends the current through the machine without moving anything. */
export function encipher(state: MachineState, input: number): { output: number; trace: TraceStep[] } {
  const trace: TraceStep[] = []
  const plugboard = plugboardPermutation(state.plugboard)
  const hop = (component: TraceComponent, direction: 'in' | 'out', from: number, to: number, slot?: number) => {
    trace.push({ component, direction, input: from, output: to, ...(slot === undefined ? {} : { slot }) })
    return to
  }

  let signal = hop('plugboard', 'in', input, plugboard[input])
  // The military entry wheel (Eintrittswalze) is wired A→A, B→B, …
  signal = hop('entry', 'in', signal, signal)
  for (let slot = state.rotors.length - 1; slot >= 0; slot--) {
    signal = hop('rotor', 'in', signal, throughRotor(state.rotors[slot], signal, 'forward'), slot)
  }
  signal = hop('reflector', 'in', signal, reflectorTables[state.reflector][signal])
  for (let slot = 0; slot < state.rotors.length; slot++) {
    signal = hop('rotor', 'out', signal, throughRotor(state.rotors[slot], signal, 'backward'), slot)
  }
  signal = hop('entry', 'out', signal, signal)
  signal = hop('plugboard', 'out', signal, plugboard[signal])

  return { output: signal, trace }
}

/** A full key press: rotors step, then the lamp for the enciphered letter lights. */
export function pressKey(state: MachineState, key: Letter): KeyPress {
  const stepped = step(state)
  const { output, trace } = encipher(stepped, toIndex(key))
  return { state: stepped, output: toLetter(output), trace }
}

/** Types a whole text, skipping anything that is not on the keyboard. */
export function typeText(state: MachineState, text: string): { state: MachineState; output: string } {
  let current = state
  let output = ''
  for (const char of text) {
    if (!isLetter(char)) continue
    const press = pressKey(current, char)
    current = press.state
    output += press.output
  }
  return { state: current, output }
}
