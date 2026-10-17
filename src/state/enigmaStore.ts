import { create } from 'zustand'
import { createMachine, pressKey, type Letter, type MachineState, type TraceStep } from '../engine'

export type PressSource = 'pointer' | 'keyboard'

const DEFAULT_MACHINE = createMachine({
  model: 'I',
  reflector: 'B',
  rotors: [
    { id: 'I', ring: 0, position: 0 },
    { id: 'II', ring: 0, position: 0 },
    { id: 'III', ring: 0, position: 0 },
  ],
  plugboard: [],
})

interface EnigmaStore {
  machine: MachineState
  /** Key held down right now. While one is down the others are mechanically locked. */
  pressedKey: Letter | null
  pressedBy: PressSource | null
  litLamp: Letter | null
  trace: TraceStep[]
  tape: { input: string; output: string }

  pressKey: (key: Letter, source: PressSource) => void
  releaseKey: (source: PressSource, key?: Letter) => void
  releaseAll: () => void
  clearTape: () => void
}

export const useEnigma = create<EnigmaStore>()((set, get) => ({
  machine: DEFAULT_MACHINE,
  pressedKey: null,
  pressedBy: null,
  litLamp: null,
  trace: [],
  tape: { input: '', output: '' },

  pressKey: (key, source) => {
    const { pressedKey, machine, tape } = get()
    if (pressedKey !== null) return
    const press = pressKey(machine, key)
    set({
      machine: press.state,
      pressedKey: key,
      pressedBy: source,
      litLamp: press.output,
      trace: press.trace,
      tape: { input: tape.input + key, output: tape.output + press.output },
    })
  },

  releaseKey: (source, key) => {
    const { pressedKey, pressedBy } = get()
    if (pressedBy !== source || (key !== undefined && key !== pressedKey)) return
    set({ pressedKey: null, pressedBy: null, litLamp: null })
  },

  releaseAll: () => set({ pressedKey: null, pressedBy: null, litLamp: null }),

  clearTape: () => set({ tape: { input: '', output: '' } }),
}))
