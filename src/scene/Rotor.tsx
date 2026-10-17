import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef, useState } from 'react'
import { Vector3, type Group } from 'three'
import { formatRingLabel, MODELS, mod } from '../engine'
import { useDragSteps } from '../hooks/useDragSteps'
import { useEnigma, type RotorName } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { boxSlotX, ROTOR, ROTOR_BOX, ROTOR_HOUSING_CENTER_Z, ROTOR_STEP_ANGLE, rotorX } from './layout'
import { materials } from './materials'
import { thumbwheelGeometry } from './plate'

const RING_FACE = { foreground: '#151310', background: '#e7dfc9', scale: 0.62, aspect: 1.8 }
const NAME_FACE = { foreground: '#e9e1cc', background: '#5e5e5c', scale: 0.5 }
const LABEL = { width: ROTOR.ringWidth - 0.1, height: ((Math.PI * 2 * ROTOR.ringRadius) / 26) * 0.92 }
const CORE = { x: -0.45, width: 2.1 }
const PIXELS_PER_STEP = 14
const WHEEL_DELTA_PER_STEP = 40
/** How high a rotor is lifted while it travels between the machine and its box. */
const MAX_LIFT = 9

const wheelGeometry = thumbwheelGeometry(ROTOR.wheelRadius, ROTOR.wheelWidth, ROTOR.teeth)

/** Shortest way round between two angles that are whole rotor steps apart. */
function towards(current: number, steps: number): number {
  const delta = mod(steps - Math.round(current / ROTOR_STEP_ANGLE))
  return current + (delta > 13 ? delta - 26 : delta) * ROTOR_STEP_ANGLE
}

interface RotorProps {
  id: RotorName
  /** Place of this rotor in its box. */
  home: number
  homeCount: number
}

/**
 * One physical rotor. In the machine it turns with the key presses and shows its position in the
 * window; in the box it lies with the ring-setting clip on top so its Ringstellung can be read and
 * changed. It flies between both places when put in or taken out.
 */
export function Rotor({ id, home, homeCount }: RotorProps) {
  const travel = useRef<Group>(null)
  const body = useRef<Group>(null)
  const core = useRef<Group>(null)
  const place = useRef<Vector3 | null>(null)
  const angles = useRef<{ body: number; core: number } | null>(null)
  const wheelDelta = useRef(0)
  const [hovered, setHovered] = useState(false)

  const model = useEnigma((s) => s.model)
  const slot = useEnigma((s) => s.slots.indexOf(id))
  const lidOpen = useEnigma((s) => s.innerLidOpen)
  const grabbed = useEnigma((s) => s.grabbedRotor === id)
  const installed = slot !== -1
  const canLift = installed && lidOpen
  useCursor(hovered || grabbed, grabbed ? 'grabbing' : canLift ? 'pointer' : 'grab')

  const ringStyle = MODELS[model].ringLabels
  const labels = useMemo(() => Array.from({ length: 26 }, (_, i) => labelTexture(formatRingLabel(i, ringStyle), RING_FACE)), [ringStyle])
  const nameTag = useMemo(() => labelTexture(id, NAME_FACE), [id])
  const homePlace = useMemo(() => new Vector3(boxSlotX(ROTOR_BOX, home, homeCount), ROTOR_BOX.axleY, ROTOR_BOX.z), [home, homeCount])

  useFrame((_, delta) => {
    const state = useEnigma.getState()
    const piece = state.rotors[id]
    const slotNow = state.slots.indexOf(id)
    const target =
      slotNow === -1 ? homePlace : new Vector3(rotorX(slotNow, state.slots.length), ROTOR.axleY, ROTOR_HOUSING_CENTER_Z)
    // In the machine the window letter is on top; in the box the ring-setting clip is.
    const bodySteps = slotNow === -1 ? piece.ring : piece.position

    if (place.current === null || angles.current === null) {
      place.current = target.clone()
      angles.current = { body: bodySteps * ROTOR_STEP_ANGLE, core: -piece.ring * ROTOR_STEP_ANGLE }
      body.current!.rotation.x = angles.current.body
      core.current!.rotation.x = angles.current.core
    }
    angles.current.body = towards(angles.current.body, bodySteps)
    angles.current.core = towards(angles.current.core, -piece.ring)

    easing.damp3(place.current, target, 0.3, delta)
    const lift = Math.min(place.current.distanceTo(target) * 0.8, MAX_LIFT)
    travel.current!.position.set(place.current.x, place.current.y + lift, place.current.z)
    easing.damp(body.current!.rotation, 'x', angles.current.body, 0.05, delta)
    easing.damp(core.current!.rotation, 'x', angles.current.core, 0.05, delta)
  })

  const { turnRotor, turnRing, removeRotor, installRotor, setGrabbedRotor, setHoveredRotor } = useEnigma.getState()
  /** In the machine the thumbwheel sets the position; out of it, the whole rotor turns the ring. */
  const turn = (steps: number) => {
    const slotNow = useEnigma.getState().slots.indexOf(id)
    if (slotNow === -1) turnRing(id, steps)
    else turnRotor(slotNow, steps)
  }

  const startDrag = useDragSteps({
    pixelsPerStep: PIXELS_PER_STEP,
    onStart: () => setGrabbedRotor(id),
    onStep: turn,
    onEnd: (moved) => {
      setGrabbedRotor(null)
      if (!moved) {
        const slotNow = useEnigma.getState().slots.indexOf(id)
        if (slotNow === -1) installRotor(id)
        else removeRotor(slotNow)
      }
    },
  })

  const handlers = {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      startDrag(event.nativeEvent.clientY)
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      setHovered(true)
      setHoveredRotor(id)
    },
    onPointerOut: () => {
      setHovered(false)
      setHoveredRotor(null)
    },
    onWheel: (event: ThreeEvent<WheelEvent>) => {
      event.stopPropagation()
      // Trackpads send many small deltas: accumulate them into whole notches.
      wheelDelta.current += event.deltaY
      const steps = Math.trunc(wheelDelta.current / WHEEL_DELTA_PER_STEP)
      if (steps !== 0) {
        wheelDelta.current -= steps * WHEEL_DELTA_PER_STEP
        turn(steps)
      }
    },
  }

  return (
    <group ref={travel}>
      <group ref={body} {...handlers}>
        {/* Wired core, turned against the ring by the Ringstellung. */}
        <group ref={core}>
          <mesh material={materials.steel} position-x={CORE.x} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[ROTOR.coreRadius, ROTOR.coreRadius, CORE.width, 48]} />
          </mesh>
          <mesh position-x={CORE.x - CORE.width / 2 - 0.005} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[1.6, 1.6]} />
            <meshStandardMaterial map={nameTag} roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Ring-setting clip: the ring letter next to it is the Ringstellung. */}
          <mesh material={materials.nickel} position={[-ROTOR.ringWidth / 2 - 0.14, ROTOR.coreRadius + 0.12, 0]}>
            <boxGeometry args={[0.22, 0.34, 0.4]} />
          </mesh>
          <mesh position={[-ROTOR.ringWidth / 2 - 0.14, ROTOR.coreRadius + 0.3, 0]}>
            <boxGeometry args={[0.2, 0.04, 0.2]} />
            <meshStandardMaterial color="#b3261e" roughness={0.5} />
          </mesh>
        </group>
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
        <mesh geometry={wheelGeometry} material={materials.aluminium} position-x={ROTOR.wheelOffset} />
      </group>
    </group>
  )
}
