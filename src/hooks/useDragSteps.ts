import { useEffect, useRef } from 'react'

const CLICK_TOLERANCE = 4

interface DragStepsOptions {
  /** Pixels of vertical pointer travel per step. */
  pixelsPerStep: number
  onStart: () => void
  onStep: (steps: number) => void
  /** `moved` is false when the pointer barely moved: a click rather than a drag. */
  onEnd: (moved: boolean) => void
}

/**
 * Turns a vertical pointer drag into discrete steps, like rolling a thumbwheel: dragging down
 * (towards the operator) gives positive steps. Returns the handler for the pointer-down event.
 */
export function useDragSteps({ pixelsPerStep, onStart, onStep, onEnd }: DragStepsOptions) {
  const cleanup = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanup.current?.(), [])

  return (startY: number) => {
    cleanup.current?.()
    let applied = 0
    let moved = false
    const onMove = (event: PointerEvent) => {
      moved ||= Math.abs(event.clientY - startY) > CLICK_TOLERANCE
      const steps = Math.trunc((event.clientY - startY) / pixelsPerStep)
      if (steps !== applied) {
        onStep(steps - applied)
        applied = steps
      }
    }
    const onUp = () => {
      cleanup.current?.()
      onEnd(moved)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    cleanup.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      cleanup.current = null
    }
    onStart()
  }
}
