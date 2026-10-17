import { useEffect } from 'react'
import { useEnigma } from '../state/enigmaStore'
import { sounds } from './sounds'

/**
 * Plays the machine's mechanical sounds by watching the store: the scene stays silent code and
 * every way of operating the machine (keyboard, pointer, buttons) sounds the same.
 */
export function useMachineSounds() {
  useEffect(
    () =>
      useEnigma.subscribe((state, previous) => {
        if (!state.soundOn) return

        if (state.pressedKey !== null && previous.pressedKey === null) sounds.keyDown()
        if (state.pressedKey === null && previous.pressedKey !== null) sounds.keyUp()

        // Positions and rings that moved: by a key press they are pawl steps, by hand detents.
        let order = 0
        for (const id of Object.keys(state.rotors) as (keyof typeof state.rotors)[]) {
          const [now, before] = [state.rotors[id], previous.rotors[id]]
          if (!before || (now.position === before.position && now.ring === before.ring)) continue
          if (state.pressedKey !== null && previous.pressedKey === null) sounds.rotorStep(order++)
          else sounds.detent()
        }

        if (state.plugboard.length > previous.plugboard.length) sounds.plugIn()
        if (state.cableDrag !== null && previous.cableDrag === null && state.plugboard.length < previous.plugboard.length) sounds.plugOut()

        if (state.slots !== previous.slots || state.reflector !== previous.reflector) sounds.partSet()

        if (state.caseOpen !== previous.caseOpen) sounds.lid(!state.caseOpen)
        else if (state.flapOpen !== previous.flapOpen) sounds.lid(!state.flapOpen)
        else if (state.innerLidOpen !== previous.innerLidOpen) sounds.lid(!state.innerLidOpen)
      }),
    [],
  )
}
