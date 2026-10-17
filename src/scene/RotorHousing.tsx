import { useMemo } from 'react'
import { MODELS } from '../engine'
import { useEnigma } from '../state/enigmaStore'
import { PLATE_Y, ROTOR, ROTOR_HOUSING, rotorX } from './layout'
import { materials } from './materials'
import { plateWithHoles, type Hole } from './plate'
import { Rotor } from './Rotor'

const { width, zFront, zBack, height, wall, lidThickness } = ROTOR_HOUSING
const DEPTH = zFront - zBack
const CENTER = { x: 0, z: (zFront + zBack) / 2 }
const WINDOW = { width: 1.7, depth: 1 }
// The slot has to clear the thumbwheel where it crosses the underside of the lid.
const SLOT = {
  width: ROTOR.wheelWidth + 0.15,
  depth: 2 * Math.sqrt(ROTOR.wheelRadius ** 2 - (PLATE_Y + height - ROTOR.axleY) ** 2) + 0.1,
}

function lidHoles(count: number): Hole[] {
  return Array.from({ length: count }, (_, slot) => [
    { kind: 'rect' as const, x: rotorX(slot, count), z: CENTER.z, ...WINDOW },
    { kind: 'rect' as const, x: rotorX(slot, count) + ROTOR.wheelOffset, z: CENTER.z, ...SLOT },
  ]).flat()
}

/** Hollow compartment over the rotors: four walls and the inner lid with windows and slots. */
export function RotorHousing() {
  const model = useEnigma((s) => s.machine.model)
  const count = useEnigma((s) => s.machine.rotors.length)
  const lid = useMemo(() => plateWithHoles(width, DEPTH, lidThickness, lidHoles(count), CENTER), [count])
  const walls: { position: [number, number, number]; size: [number, number, number] }[] = [
    { position: [CENTER.x, PLATE_Y + height / 2, zFront - wall / 2], size: [width, height, wall] },
    { position: [CENTER.x, PLATE_Y + height / 2, zBack + wall / 2], size: [width, height, wall] },
    { position: [CENTER.x - width / 2 + wall / 2, PLATE_Y + height / 2, CENTER.z], size: [wall, height, DEPTH] },
    { position: [CENTER.x + width / 2 - wall / 2, PLATE_Y + height / 2, CENTER.z], size: [wall, height, DEPTH] },
  ]

  return (
    <group>
      {walls.map(({ position, size }, i) => (
        <mesh key={i} material={materials.crinklePaint} position={position} castShadow receiveShadow>
          <boxGeometry args={size} />
        </mesh>
      ))}
      {/* No shadow from the lid, or the rings under the windows would be unreadable. */}
      <mesh geometry={lid} material={materials.crinklePaint} position-y={PLATE_Y + height} receiveShadow />
      {Array.from({ length: count }, (_, slot) => (
        <Rotor key={slot} slot={slot} x={rotorX(slot, count)} z={CENTER.z} ringLabels={MODELS[model].ringLabels} />
      ))}
    </group>
  )
}
