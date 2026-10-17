import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { toIndex } from '../alphabet'
import { typeText, type MachineState, type RotorSetting } from '../machine'
import { machineArb, textArb } from './arbitraries'

/**
 * Oracle properties: the generic properties above cannot tell a miscopied wiring
 * apart from the real one, so these pin the engine to verified historical output.
 */

const rotor = (id: RotorSetting['id'], ring: string, position: string): RotorSetting => ({
  id,
  ring: toIndex(ring),
  position: toIndex(position),
})

interface Vector {
  name: string
  machine: MachineState
  plaintext: string
  ciphertext: string
}

const barbarossaBoard = ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX']

const VECTORS: Vector[] = [
  {
    name: 'Enigma I, I-II-III, UKW-B, rings AAA, start AAA',
    machine: { model: 'I', reflector: 'B', rotors: [rotor('I', 'A', 'A'), rotor('II', 'A', 'A'), rotor('III', 'A', 'A')], plugboard: [] },
    plaintext: 'AAAAA',
    ciphertext: 'BDZGO',
  },
  {
    // Operation Barbarossa, 7 July 1941: message key KCH enciphered at WXC.
    name: 'Barbarossa 1941, message key',
    machine: { model: 'I', reflector: 'B', rotors: [rotor('II', 'B', 'W'), rotor('IV', 'U', 'X'), rotor('V', 'L', 'C')], plugboard: barbarossaBoard },
    plaintext: 'BLA',
    ciphertext: 'KCH',
  },
  {
    name: 'Barbarossa 1941, message body',
    machine: { model: 'I', reflector: 'B', rotors: [rotor('II', 'B', 'B'), rotor('IV', 'U', 'L'), rotor('V', 'L', 'A')], plugboard: barbarossaBoard },
    plaintext: 'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAFFLIEG',
    ciphertext: 'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLTTDEIS',
  },
]

describe('oracle: historical vectors', () => {
  it('reproduces every known ciphertext and recovers its plaintext', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VECTORS), (vector) => {
        expect(typeText(vector.machine, vector.plaintext).output, vector.name).toBe(vector.ciphertext)
        expect(typeText(vector.machine, vector.ciphertext).output, vector.name).toBe(vector.plaintext)
      }),
    )
  })
})

describe('oracle: M4 backwards compatibility', () => {
  // With the thin rotor at A (ring A), Beta + B-thin acts as UKW-B and Gamma + C-thin as UKW-C,
  // which let U-boats talk to M3 machines. This pins the four thin wirings.
  it('M4 with Beta/B-thin or Gamma/C-thin at A equals an M3 with UKW-B or UKW-C', () => {
    fc.assert(
      fc.property(machineArb(['M3']), fc.constantFrom(['Beta', 'B'] as const, ['Gamma', 'C'] as const), textArb, (m3, [greek, reflector], text) => {
        const three: MachineState = { ...m3, reflector }
        const four: MachineState = {
          ...m3,
          model: 'M4',
          reflector: reflector === 'B' ? 'B-thin' : 'C-thin',
          rotors: [{ id: greek, ring: 0, position: 0 }, ...m3.rotors],
        }
        expect(typeText(four, text).output).toBe(typeText(three, text).output)
      }),
    )
  })
})
