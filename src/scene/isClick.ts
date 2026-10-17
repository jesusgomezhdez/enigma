import type { ThreeEvent } from '@react-three/fiber'

/** Pixels the pointer may travel between press and release and still count as a click. */
const CLICK_TOLERANCE = 4

/**
 * R3F fires onClick even after a drag, so orbiting the camera across a lid would toggle it.
 * Swallows the event and tells whether it was a real click.
 */
export function isClick(event: ThreeEvent<MouseEvent>): boolean {
  event.stopPropagation()
  return event.delta <= CLICK_TOLERANCE
}
