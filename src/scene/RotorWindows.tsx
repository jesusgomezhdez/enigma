import { useMemo } from 'react'
import { formatRingLabel, MODELS } from '../engine'
import { useEnigma } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { PLATE_Y, ROTOR_HOUSING } from './layout'
import { materials } from './materials'
import { plateWithHoles } from './plate'

const WINDOW = { width: 1.5, depth: 1.5 }
const LID_THICKNESS = 0.15
const RING_FACE = { foreground: '#111', background: '#e9e2cf', scale: 0.58 }
const { width, zFront, zBack, height, windowPitch } = ROTOR_HOUSING
const DEPTH = zFront - zBack
const CENTER = { x: 0, z: (zFront + zBack) / 2 }

const windowX = (slot: number, count: number) => (slot - (count - 1) / 2) * windowPitch

/**
 * Inner lid over the rotors with one window per rotor showing its current position.
 * Phase 3 replaces the printed labels with the real rotors turning underneath.
 */
export function RotorWindows() {
  const machine = useEnigma((s) => s.machine)
  const ringLabels = MODELS[machine.model].ringLabels
  const count = machine.rotors.length

  const lid = useMemo(
    () =>
      plateWithHoles(
        width,
        DEPTH,
        LID_THICKNESS,
        Array.from({ length: count }, (_, slot) => ({ kind: 'rect' as const, x: windowX(slot, count), z: CENTER.z, ...WINDOW })),
        CENTER,
      ),
    [count],
  )

  return (
    <group>
      <mesh material={materials.crinklePaint} position={[CENTER.x, PLATE_Y + height / 2, CENTER.z]} castShadow receiveShadow>
        <boxGeometry args={[width, height, DEPTH]} />
      </mesh>
      <mesh geometry={lid} material={materials.crinklePaint} position-y={PLATE_Y + height} castShadow receiveShadow />
      {machine.rotors.map((rotor, slot) => (
        <mesh key={slot} position={[windowX(slot, count), PLATE_Y + height + 0.01, CENTER.z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[WINDOW.width + 0.2, WINDOW.depth + 0.2]} />
          <meshStandardMaterial map={labelTexture(formatRingLabel(rotor.position, ringLabels), RING_FACE)} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}
