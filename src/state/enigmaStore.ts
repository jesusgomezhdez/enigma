import { create } from 'zustand'
import { createMachine, mod, pressKey, type Letter, type MachineState, type TraceStep } from '../engine'

export type PressSource = 'pointer' | 'keyboard'
export type ViewId = 'machine' | 'rotors' | 'plugboard'

/** From 1939 the daily key sheets called for ten plugboard cables. */
export const CABLES_ISSUED = 10

export function partnerOf(plugboard: readonly string[], letter: Letter): Letter | null {
  const pair = plugboard.find((p) => p.includes(letter))
  return pair ? (pair[0] === letter ? pair[1] : pair[0]) : null
}

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
  /** Rotor slot whose thumbwheel is being dragged / hovered, so the camera keeps still. */
  grabbedRotor: number | null
  hoveredRotor: number | null
  /** Socket holding the far end of the cable being dragged. */
  cableDrag: Letter | null
  flapOpen: boolean
  view: ViewId
  /** Bumped on every view request so picking the same view again re-centres the camera. */
  viewRequest: number

  pressKey: (key: Letter, source: PressSource) => void
  releaseKey: (source: PressSource, key?: Letter) => void
  releaseAll: () => void
  clearTape: () => void
  /** Rolls a rotor by its thumbwheel. Impossible while a key is down: the stepping pawls are engaged. */
  turnRotor: (slot: number, steps: number) => void
  setGrabbedRotor: (slot: number | null) => void
  setHoveredRotor: (slot: number | null) => void
  /** Starts dragging a cable from a socket: a fresh cable if it is free, or pulls out the plug in it. */
  grabSocket: (letter: Letter) => void
  /** Ends the drag: plugs into `target` if it is a free socket, otherwise the cable is put away. */
  dropCable: (target: Letter | null) => void
  setFlapOpen: (open: boolean) => void
  setView: (view: ViewId) => void
}

export const useEnigma = create<EnigmaStore>()((set, get) => ({
  machine: DEFAULT_MACHINE,
  pressedKey: null,
  pressedBy: null,
  litLamp: null,
  trace: [],
  tape: { input: '', output: '' },
  grabbedRotor: null,
  hoveredRotor: null,
  cableDrag: null,
  flapOpen: false,
  view: 'machine',
  viewRequest: 0,

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

  turnRotor: (slot, steps) => {
    const { machine, pressedKey } = get()
    if (pressedKey !== null || steps === 0) return
    const rotors = machine.rotors.map((rotor, i) => (i === slot ? { ...rotor, position: mod(rotor.position + steps) } : rotor))
    set({ machine: { ...machine, rotors } })
  },

  setGrabbedRotor: (slot) => set({ grabbedRotor: slot }),
  setHoveredRotor: (slot) => set({ hoveredRotor: slot }),

  grabSocket: (letter) => {
    const { machine, pressedKey } = get()
    if (pressedKey !== null) return
    const partner = partnerOf(machine.plugboard, letter)
    if (partner === null) {
      if (machine.plugboard.length >= CABLES_ISSUED) return
      set({ cableDrag: letter })
      return
    }
    // Pulling a plug out leaves the cable hanging from its other end.
    const plugboard = machine.plugboard.filter((pair) => !pair.includes(letter))
    set({ machine: { ...machine, plugboard }, cableDrag: partner })
  },

  dropCable: (target) => {
    const { machine, cableDrag } = get()
    if (cableDrag === null) return
    const isFree = target !== null && target !== cableDrag && partnerOf(machine.plugboard, target) === null
    const plugboard = isFree ? [...machine.plugboard, cableDrag + target] : machine.plugboard
    set({ machine: { ...machine, plugboard }, cableDrag: null })
  },

  setFlapOpen: (open) => set({ flapOpen: open }),

  setView: (view) =>
    set((state) => ({
      view,
      viewRequest: state.viewRequest + 1,
      // The plugboard is behind the front flap.
      flapOpen: view === 'plugboard' ? true : state.flapOpen,
    })),
}))
