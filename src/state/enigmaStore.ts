import { create } from 'zustand'
import {
  MODELS,
  mod,
  pressKey,
  type GreekRotorId,
  type Letter,
  type MachineState,
  type ModelId,
  type ReflectorId,
  type RotorId,
  type TraceStep,
} from '../engine'

export type PressSource = 'pointer' | 'keyboard'
export type ViewId = 'machine' | 'rotors' | 'interior' | 'plugboard'
export type RotorName = RotorId | GreekRotorId

/** A physical rotor keeps its ring setting and the letter it shows wherever it is. */
export interface RotorPiece {
  ring: number
  position: number
}

/** From 1939 the daily key sheets called for ten plugboard cables. */
export const CABLES_ISSUED = 10

export function partnerOf(plugboard: readonly string[], letter: Letter): Letter | null {
  const pair = plugboard.find((p) => p.includes(letter))
  return pair ? (pair[0] === letter ? pair[1] : pair[0]) : null
}

/** Rotors that come in the box of a model: the stepping ones plus the thin ones of the M4. */
export function rotorsOf(model: ModelId): RotorName[] {
  return [...MODELS[model].greekRotors, ...MODELS[model].rotors]
}

/** The M4 takes a thin rotor in its leftmost slot and normal rotors elsewhere. */
export function fitsSlot(model: ModelId, slot: number, rotor: RotorName): boolean {
  const greek: readonly string[] = MODELS[model].greekRotors
  const isGreekSlot = model === 'M4' && slot === 0
  return isGreekSlot === greek.includes(rotor)
}

interface MachineParts {
  model: ModelId
  /** Rotor in each slot, left to right; null while the slot is empty. */
  slots: (RotorName | null)[]
  rotors: Record<RotorName, RotorPiece>
  reflector: ReflectorId | null
  plugboard: string[]
}

/** The cipher machine the engine sees, or null while a rotor or the reflector is missing. */
export function assembleMachine(parts: MachineParts): MachineState | null {
  const { model, slots, rotors, reflector, plugboard } = parts
  if (reflector === null || slots.some((slot) => slot === null)) return null
  return {
    model,
    reflector,
    plugboard,
    rotors: slots.map((id) => ({ id: id!, ring: rotors[id!].ring, position: rotors[id!].position })),
  }
}

const SOUND_PREFERENCE_KEY = 'enigma:sound'

function readSoundPreference(): boolean {
  try {
    return localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'off'
  } catch {
    return true
  }
}

function freshRotors(model: ModelId): Record<RotorName, RotorPiece> {
  return Object.fromEntries(rotorsOf(model).map((id) => [id, { ring: 0, position: 0 }])) as Record<RotorName, RotorPiece>
}

interface EnigmaStore extends MachineParts {
  /** Key held down right now. While one is down the others are mechanically locked. */
  pressedKey: Letter | null
  pressedBy: PressSource | null
  litLamp: Letter | null
  trace: TraceStep[]
  tape: { input: string; output: string }
  /** Rotor being turned / hovered by hand, so the camera keeps still. */
  grabbedRotor: RotorName | null
  hoveredRotor: RotorName | null
  /** Socket holding the far end of the cable being dragged. */
  cableDrag: Letter | null
  /** The wooden lid of the transport case. Closed, nothing on the machine can be reached. */
  caseOpen: boolean
  flapOpen: boolean
  innerLidOpen: boolean
  soundOn: boolean
  view: ViewId
  /** Bumped on every view request so picking the same view again re-centres the camera. */
  viewRequest: number

  pressKey: (key: Letter, source: PressSource) => void
  releaseKey: (source: PressSource, key?: Letter) => void
  releaseAll: () => void
  clearTape: () => void
  /** Rolls an installed rotor by its thumbwheel. Impossible while a key is down: the pawls are engaged. */
  turnRotor: (slot: number, steps: number) => void
  /** Turns the alphabet ring of a rotor out of the machine against its wired core (Ringstellung). */
  turnRing: (rotor: RotorName, steps: number) => void
  /** Lifts the rotor out of a slot and puts it back in its box. Needs the inner lid open. */
  removeRotor: (slot: number) => void
  /** Puts a rotor from the box into the leftmost free slot it fits. */
  installRotor: (rotor: RotorName) => void
  removeReflector: () => void
  installReflector: (reflector: ReflectorId) => void
  setGrabbedRotor: (rotor: RotorName | null) => void
  setHoveredRotor: (rotor: RotorName | null) => void
  /** Starts dragging a cable from a socket: a fresh cable if it is free, or pulls out the plug in it. */
  grabSocket: (letter: Letter) => void
  /** Ends the drag: plugs into `target` if it is a free socket, otherwise the cable is put away. */
  dropCable: (target: Letter | null) => void
  setFlapOpen: (open: boolean) => void
  setInnerLidOpen: (open: boolean) => void
  /** Closing the case folds the front flap and the inner lid first, as they would not fit otherwise. */
  setCaseOpen: (open: boolean) => void
  setSoundOn: (on: boolean) => void
  setView: (view: ViewId) => void
}

export const useEnigma = create<EnigmaStore>()((set, get) => ({
  model: 'I',
  slots: ['I', 'II', 'III'],
  rotors: freshRotors('I'),
  reflector: 'B',
  plugboard: [],
  pressedKey: null,
  pressedBy: null,
  litLamp: null,
  trace: [],
  tape: { input: '', output: '' },
  grabbedRotor: null,
  hoveredRotor: null,
  cableDrag: null,
  caseOpen: true,
  flapOpen: false,
  innerLidOpen: false,
  soundOn: readSoundPreference(),
  view: 'machine',
  viewRequest: 0,

  pressKey: (key, source) => {
    const state = get()
    if (state.pressedKey !== null || !state.caseOpen) return
    const machine = assembleMachine(state)
    if (machine === null) {
      // The key still goes down, but with a slot empty the circuit is open: no stepping, no lamp.
      set({ pressedKey: key, pressedBy: source, litLamp: null, trace: [] })
      return
    }
    const press = pressKey(machine, key)
    const rotors = { ...state.rotors }
    press.state.rotors.forEach(({ id, position }) => {
      rotors[id] = { ...rotors[id], position }
    })
    set({
      rotors,
      pressedKey: key,
      pressedBy: source,
      litLamp: press.output,
      trace: press.trace,
      tape: { input: state.tape.input + key, output: state.tape.output + press.output },
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
    const { slots, rotors, pressedKey } = get()
    const id = slots[slot]
    if (pressedKey !== null || steps === 0 || id == null) return
    set({ rotors: { ...rotors, [id]: { ...rotors[id], position: mod(rotors[id].position + steps) } } })
  },

  turnRing: (id, steps) => {
    const { slots, rotors } = get()
    if (steps === 0 || slots.includes(id)) return
    // The core stays still while the ring turns, so the letter on top moves with the ring.
    const piece = rotors[id]
    set({ rotors: { ...rotors, [id]: { ring: mod(piece.ring + steps), position: mod(piece.position + steps) } } })
  },

  removeRotor: (slot) => {
    const { slots, innerLidOpen, pressedKey } = get()
    if (!innerLidOpen || pressedKey !== null || slots[slot] === null) return
    set({ slots: slots.map((id, i) => (i === slot ? null : id)) })
  },

  installRotor: (id) => {
    const { model, slots, innerLidOpen, pressedKey } = get()
    if (!innerLidOpen || pressedKey !== null || slots.includes(id)) return
    const slot = slots.findIndex((current, i) => current === null && fitsSlot(model, i, id))
    if (slot === -1) return
    set({ slots: slots.map((current, i) => (i === slot ? id : current)) })
  },

  removeReflector: () => {
    const { innerLidOpen, pressedKey } = get()
    if (!innerLidOpen || pressedKey !== null) return
    set({ reflector: null })
  },

  installReflector: (reflector) => {
    const state = get()
    if (!state.innerLidOpen || state.pressedKey !== null || state.reflector !== null) return
    set({ reflector })
  },

  setGrabbedRotor: (rotor) => set({ grabbedRotor: rotor }),
  setHoveredRotor: (rotor) => set({ hoveredRotor: rotor }),

  grabSocket: (letter) => {
    const { plugboard, pressedKey } = get()
    if (pressedKey !== null) return
    const partner = partnerOf(plugboard, letter)
    if (partner === null) {
      if (plugboard.length >= CABLES_ISSUED) return
      set({ cableDrag: letter })
      return
    }
    // Pulling a plug out leaves the cable hanging from its other end.
    set({ plugboard: plugboard.filter((pair) => !pair.includes(letter)), cableDrag: partner })
  },

  dropCable: (target) => {
    const { plugboard, cableDrag } = get()
    if (cableDrag === null) return
    const isFree = target !== null && target !== cableDrag && partnerOf(plugboard, target) === null
    set({ plugboard: isFree ? [...plugboard, cableDrag + target] : plugboard, cableDrag: null })
  },

  setFlapOpen: (open) => {
    if (get().caseOpen) set({ flapOpen: open })
  },

  setInnerLidOpen: (open) => {
    if (get().pressedKey !== null || !get().caseOpen) return
    set({ innerLidOpen: open })
  },

  setCaseOpen: (open) => {
    const { pressedKey, cableDrag, grabbedRotor } = get()
    if (pressedKey !== null || cableDrag !== null || grabbedRotor !== null) return
    set(open ? { caseOpen: true } : { caseOpen: false, flapOpen: false, innerLidOpen: false })
  },

  setSoundOn: (on) => {
    try {
      localStorage.setItem(SOUND_PREFERENCE_KEY, on ? 'on' : 'off')
    } catch {
      // Storage unavailable (private mode): the choice just won't be remembered.
    }
    set({ soundOn: on })
  },

  setView: (view) =>
    set((state) => ({
      view,
      viewRequest: state.viewRequest + 1,
      // Each view uncovers what it is there to show.
      caseOpen: true,
      flapOpen: view === 'plugboard' ? true : state.flapOpen,
      innerLidOpen: view === 'interior' ? true : state.innerLidOpen,
    })),
}))
