import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { formatRingLabel, mod } from '../engine'
import { useDragSteps } from '../hooks/useDragSteps'
import { useEnigma } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { ROTOR, ROTOR_STEP_ANGLE } from './layout'
import { materials } from './materials'
import { thumbwheelGeometry } from './plate'

const RING_FACE = { foreground: '#151310', background: '#e7dfc9', scale: 0.62, aspect: 1.8 }
const LABEL = { width: ROTOR.ringWidth - 0.1, height: ((Math.PI * 2 * ROTOR.ringRadius) / 26) * 0.92 }
const PIXELS_PER_STEP = 14
const WHEEL_DELTA_PER_STEP = 40

const wheelGeometry = thumbwheelGeometry(ROTOR.wheelRadius, ROTOR.wheelWidth, ROTOR.teeth)

interface RotorProps {
  slot: number
  x: number
  z: number
  ringLabels: 'numbers' | 'letters'
}

/** Shortest way round from one position to the next, so 26 → 01 is one step forward. */
function shortestSteps(from: number, to: number): number {
  const delta = mod(to - from)
  return delta > 13 ? delta - 26 : delta
}

/**
 * One rotor: alphabet ring, wired core and thumbwheel, turning on the shared axle.
 * Position p puts label p at the top, right under the window.
 */
export function Rotor({ slot, x, z, ringLabels }: RotorProps) {
  const group = useRef<Group>(null)
  const angle = useRef<number | null>(null)
  const shown = useRef(0)
  const wheelDelta = useRef(0)
  const [hovered, setHovered] = useState(false)
  const grabbed = useEnigma((s) => s.grabbedRotor === slot)
  const { turnRotor, setGrabbedRotor, setHoveredRotor } = useEnigma.getState()
  useCursor(hovered || grabbed, grabbed ? 'grabbing' : 'grab')

  const labels = useMemo(
    () => Array.from({ length: 26 }, (_, i) => labelTexture(formatRingLabel(i, ringLabels), RING_FACE)),
    [ringLabels],
  )

  useFrame((_, delta) => {
    // Read straight from the store: the rotors move on every key press without re-rendering React.
    const position = useEnigma.getState().machine.rotors[slot]?.position ?? 0
    if (angle.current === null) {
      angle.current = position * ROTOR_STEP_ANGLE
      shown.current = position
      group.current!.rotation.x = angle.current
    } else if (position !== shown.current) {
      angle.current += shortestSteps(shown.current, position) * ROTOR_STEP_ANGLE
      shown.current = position
    }
    easing.damp(group.current!.rotation, 'x', angle.current, 0.05, delta)
  })

  const startDrag = useDragSteps({
    pixelsPerStep: PIXELS_PER_STEP,
    onStart: () => setGrabbedRotor(slot),
    onStep: (steps) => turnRotor(slot, steps),
    onEnd: () => setGrabbedRotor(null),
  })

  const onWheel = (event: ThreeEvent<WheelEvent>) => {
    event.stopPropagation()
    // Trackpads send many small deltas: accumulate them into whole notches.
    wheelDelta.current += event.deltaY
    const steps = Math.trunc(wheelDelta.current / WHEEL_DELTA_PER_STEP)
    if (steps !== 0) {
      wheelDelta.current -= steps * WHEEL_DELTA_PER_STEP
      turnRotor(slot, steps)
    }
  }

  return (
    <group position={[x, ROTOR.axleY, z]}>
      <group ref={group}>
        {/* Wired core with the contacts, mostly hidden inside the machine. */}
        <mesh material={materials.steel} position-x={-0.35} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[ROTOR.coreRadius, ROTOR.coreRadius, ROTOR.coreWidth, 48]} />
        </mesh>
        {/* Alphabet ring (tyre) with its 26 printed marks. */}
        <mesh material={materials.ivory} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[ROTOR.ringRadius, ROTOR.ringRadius, ROTOR.ringWidth, 52]} />
        </mesh>
        {labels.map((texture, i) => (
          <group key={i} rotation-x={-i * ROTOR_STEP_ANGLE}>
            <mesh position-y={ROTOR.ringRadius + 0.005} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[LABEL.width, LABEL.height]} />
              <meshStandardMaterial map={texture} roughness={0.55} />
            </mesh>
          </group>
        ))}
        <mesh
          geometry={wheelGeometry}
          material={materials.nickel}
          position-x={ROTOR.wheelOffset}
          onPointerDown={(event) => {
            event.stopPropagation()
            startDrag(event.nativeEvent.clientY)
          }}
          onPointerOver={(event) => {
            event.stopPropagation()
            setHovered(true)
            setHoveredRotor(slot)
          }}
          onPointerOut={() => {
            setHovered(false)
            setHoveredRotor(null)
          }}
          onWheel={onWheel}
        />
      </group>
    </group>
  )
}
