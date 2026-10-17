import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { ALPHABET, invert, mod, toIndex, toPermutation } from '../alphabet'
import { REFLECTORS, ROTORS, type RotorId } from '../data'
import { createMachine, encipher, pressKey, step, typeText, type MachineState } from '../machine'
import { plugboardPermutation } from '../plugboard'
import { letterArb, machineArb, plugboardArb, textArb } from './arbitraries'

const indices = [...ALPHABET].map((_, i) => i)
const isPermutation = (p: readonly number[]) => p.length === 26 && new Set(p).size === 26 && p.every((v) => v >= 0 && v < 26)
const positions = (state: MachineState) => state.rotors.map((rotor) => rotor.position)

describe('wiring tables', () => {
  it('every rotor is a bijection of the alphabet', () => {
    fc.assert(
      fc.property(fc.constantFrom(...(Object.keys(ROTORS) as (keyof typeof ROTORS)[])), (id) => {
        const forward = toPermutation(ROTORS[id].wiring)
        expect(isPermutation(forward)).toBe(true)
        expect(invert(invert(forward))).toEqual(forward)
      }),
    )
  })

  it('every reflector is an involution without fixed points', () => {
    fc.assert(
      fc.property(fc.constantFrom(...(Object.keys(REFLECTORS) as (keyof typeof REFLECTORS)[])), letterArb, (id, letter) => {
        const reflector = toPermutation(REFLECTORS[id])
        const x = toIndex(letter)
        expect(isPermutation(reflector)).toBe(true)
        expect(reflector[x]).not.toBe(x)
        expect(reflector[reflector[x]]).toBe(x)
      }),
    )
  })
})

describe('plugboard', () => {
  it('cables form a symmetric swap', () => {
    fc.assert(
      fc.property(plugboardArb, letterArb, (pairs, letter) => {
        const board = plugboardPermutation(pairs)
        const x = toIndex(letter)
        expect(board[board[x]]).toBe(x)
        const plugged = pairs.some((pair) => pair.includes(letter))
        expect(board[x] !== x).toBe(plugged)
      }),
    )
  })

  it('rejects a socket used by two cables', () => {
    fc.assert(
      fc.property(machineArb(), letterArb, letterArb, letterArb, (state, a, b, c) => {
        fc.pre(a !== b && a !== c)
        expect(() => createMachine({ ...state, plugboard: [a + b, a + c] })).toThrow()
      }),
    )
  })
})

describe('enciphering', () => {
  it('is reciprocal: typing the ciphertext with the same setup yields the plaintext', () => {
    fc.assert(
      fc.property(machineArb(), textArb, (state, text) => {
        const cipher = typeText(state, text).output
        expect(typeText(state, cipher).output).toBe(text)
      }),
    )
  })

  it('never lights the lamp of the pressed key', () => {
    fc.assert(
      fc.property(machineArb(), letterArb, (state, key) => {
        expect(pressKey(state, key).output).not.toBe(key)
      }),
    )
  })

  it('at a fixed rotor position is an involution without fixed points', () => {
    fc.assert(
      fc.property(machineArb(), (state) => {
        const table = indices.map((x) => encipher(state, x).output)
        expect(isPermutation(table)).toBe(true)
        indices.forEach((x) => {
          expect(table[x]).not.toBe(x)
          expect(table[table[x]]).toBe(x)
        })
      }),
    )
  })

  it('depends only on position minus ring (Ringstellung invariance)', () => {
    fc.assert(
      fc.property(machineArb(), fc.integer({ min: 0, max: 3 }), fc.integer({ min: 1, max: 25 }), letterArb, (state, slot, k, key) => {
        fc.pre(slot < state.rotors.length)
        const shifted: MachineState = {
          ...state,
          rotors: state.rotors.map((rotor, i) =>
            i === slot ? { ...rotor, ring: mod(rotor.ring + k), position: mod(rotor.position + k) } : rotor,
          ),
        }
        const x = toIndex(key)
        expect(encipher(shifted, x).output).toBe(encipher(state, x).output)
      }),
    )
  })

  it('records a trace whose hops chain from the key to the lamp', () => {
    fc.assert(
      fc.property(machineArb(), letterArb, (state, key) => {
        const { output, trace } = pressKey(state, key)
        expect(trace[0].input).toBe(toIndex(key))
        expect(trace.at(-1)!.output).toBe(toIndex(output))
        trace.slice(1).forEach((hop, i) => expect(hop.input).toBe(trace[i].output))
        expect(trace).toHaveLength(5 + 2 * state.rotors.length)
      }),
    )
  })
})

describe('rotor stepping', () => {
  it('moves the rightmost rotor on every key press, before the contact', () => {
    fc.assert(
      fc.property(machineArb(), letterArb, (state, key) => {
        const after = pressKey(state, key).state
        const last = state.rotors.length - 1
        expect(after.rotors[last].position).toBe(mod(state.rotors[last].position + 1))
        expect(encipher(after, toIndex(key)).output).toBe(toIndex(pressKey(state, key).output))
      }),
    )
  })

  it('never moves the thin rotor of the M4', () => {
    fc.assert(
      fc.property(machineArb(['M4']), fc.integer({ min: 1, max: 700 }), (state, presses) => {
        let current = state
        for (let i = 0; i < presses; i++) current = step(current)
        expect(current.rotors[0].position).toBe(state.rotors[0].position)
      }),
    )
  })

  it('double-steps: a middle rotor on its notch moves together with the left rotor', () => {
    fc.assert(
      fc.property(machineArb(), (state) => {
        const n = state.rotors.length
        const middle = state.rotors[n - 2]
        const notches = [...ROTORS[middle.id as RotorId].notches].map(toIndex)
        const atNotch: MachineState = {
          ...state,
          rotors: state.rotors.map((rotor, i) => (i === n - 2 ? { ...rotor, position: notches[0] } : rotor)),
        }
        const before = positions(atNotch)
        const after = positions(step(atNotch))
        expect(after[n - 3]).toBe(mod(before[n - 3] + 1))
        expect(after[n - 2]).toBe(mod(before[n - 2] + 1))
      }),
    )
  })

  it('has a period of 26·25·26 = 16 900 key presses with single-notch rotors', () => {
    fc.assert(
      fc.property(machineArb(['I']), (state) => {
        // One press first: some start positions are never revisited (they only exist before a double step).
        const start = step(state)
        let current = start
        for (let i = 0; i < 16_900; i++) {
          current = step(current)
          if (i < 16_899) expect(positions(current)).not.toEqual(positions(start))
        }
        expect(positions(current)).toEqual(positions(start))
      }),
      { numRuns: 15 },
    )
  })
})
