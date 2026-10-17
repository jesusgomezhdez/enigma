import { useEffect } from 'react'
import { isLetter } from '../engine'
import { useEnigma } from '../state/enigmaStore'

/** Maps the computer keyboard (and pointer releases) onto the Enigma keys. */
export function usePhysicalKeyboard() {
  useEffect(() => {
    const { pressKey, releaseKey, releaseAll } = useEnigma.getState()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !isLetter(event.key)) return
      event.preventDefault()
      pressKey(event.key.toUpperCase(), 'keyboard')
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (isLetter(event.key)) releaseKey('keyboard', event.key.toUpperCase())
    }
    // A key pressed with the pointer stays down until the button is released anywhere.
    const onPointerUp = () => releaseKey('pointer')

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('blur', releaseAll)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('blur', releaseAll)
    }
  }, [])
}
