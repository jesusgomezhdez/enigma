import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useRef } from 'react'
import type { Vector3 } from 'three'
import { useEnigma } from '../state/enigmaStore'
import { VIEWS } from './views'

interface OrbitControlsLike {
  target: Vector3
  update: () => void
  addEventListener: (type: 'start', listener: () => void) => void
  removeEventListener: (type: 'start', listener: () => void) => void
}

/** Glides the camera to the requested view; grabbing the camera by hand cancels the glide. */
export function CameraRig() {
  const viewRequest = useEnigma((s) => s.viewRequest)
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null
  const gliding = useRef(false)

  useEffect(() => {
    if (viewRequest > 0) gliding.current = true
  }, [viewRequest])

  useEffect(() => {
    if (!controls) return
    const stop = () => {
      gliding.current = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((state, delta) => {
    const orbit = state.controls as OrbitControlsLike | null
    if (!gliding.current || !orbit) return
    const view = VIEWS[useEnigma.getState().view]
    easing.damp3(state.camera.position, view.position, 0.3, delta)
    easing.damp3(orbit.target, view.target, 0.3, delta)
    orbit.update()
    if (state.camera.position.distanceTo(view.position) < 0.05 && orbit.target.distanceTo(view.target) < 0.05) {
      gliding.current = false
    }
  })

  return null
}
