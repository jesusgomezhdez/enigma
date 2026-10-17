import fc from 'fast-check'
import { ALPHABET } from '../alphabet'
import { MODELS, type ModelId } from '../data'
import type { MachineState, RotorSetting } from '../machine'

const letters = [...ALPHABET]

export const letterArb = fc.constantFrom(...letters)
export const textArb = fc.array(letterArb, { maxLength: 200 }).map((chars) => chars.join(''))
const indexArb = fc.integer({ min: 0, max: 25 })

export const plugboardArb = fc
  .integer({ min: 0, max: 13 })
  .chain((cables) => fc.shuffledSubarray(letters, { minLength: cables * 2, maxLength: cables * 2 }))
  .map((sockets) => Array.from({ length: sockets.length / 2 }, (_, i) => sockets[2 * i] + sockets[2 * i + 1]))

const settingArb = (id: RotorSetting['id']): fc.Arbitrary<RotorSetting> =>
  fc.record({ id: fc.constant(id), ring: indexArb, position: indexArb })

export function machineArb(models: readonly ModelId[] = ['I', 'M3', 'M4']): fc.Arbitrary<MachineState> {
  return fc.constantFrom(...models).chain((model) => {
    const spec = MODELS[model]
    const stepping = fc
      .shuffledSubarray([...spec.rotors], { minLength: 3, maxLength: 3 })
      .chain((ids) => fc.tuple(...ids.map(settingArb)))
    const rotors =
      model === 'M4'
        ? fc.tuple(fc.constantFrom(...spec.greekRotors).chain(settingArb), stepping).map(([greek, rest]) => [greek, ...rest])
        : stepping

    return fc.record({
      model: fc.constant(model),
      reflector: fc.constantFrom(...spec.reflectors),
      rotors,
      plugboard: plugboardArb,
    })
  })
}
