import { useCursor } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { MODELS } from '../engine'
import { rotorsOf, useEnigma } from '../state/enigmaStore'
import { END_WHEEL, PLATE_Y, ROTOR, ROTOR_HOUSING, ROTOR_HOUSING_CENTER_Z, rotorX } from './layout'
import { materials } from './materials'
import { plateWithHoles, type Hole } from './plate'
import { Reflector } from './Reflector'
import { Rotor } from './Rotor'

const { width, zFront, zBack, height, wall, lidThickness, lidOpenAngle } = ROTOR_HOUSING
const DEPTH = zFront - zBack
const CENTER = { x: 0, z: ROTOR_HOUSING_CENTER_Z }
const LID_Y = PLATE_Y + height
const WINDOW = { width: 1.7, depth: 1 }
// The slot has to clear the thumbwheel where it crosses the underside of the lid.
const SLOT = {
  width: ROTOR.wheelWidth + 0.15,
  depth: 2 * Math.sqrt(ROTOR.wheelRadius ** 2 - (LID_Y - ROTOR.axleY) ** 2) + 0.1,
}

function lidHoles(count: number): Hole[] {
  return Array.from({ length: count }, (_, slot) => [
    { kind: 'rect' as const, x: rotorX(slot, count), z: CENTER.z, ...WINDOW },
    { kind: 'rect' as const, x: rotorX(slot, count) + ROTOR.wheelOffset, z: CENTER.z, ...SLOT },
  ]).flat()
}

/** Inner lid with the windows, hinged at the back. The latch on its front edge opens it. */
function InnerLid({ count }: { count: number }) {
  const hinge = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const isOpen = useEnigma((s) => s.innerLidOpen)
  const setInnerLidOpen = useEnigma((s) => s.setInnerLidOpen)
  const lid = useMemo(() => plateWithHoles(width, DEPTH, lidThickness, lidHoles(count), CENTER), [count])
  useCursor(hovered)

  useFrame((_, delta) => {
    easing.damp(hinge.current!.rotation, 'x', isOpen ? lidOpenAngle : 0, 0.2, delta)
  })

  return (
    // The lid geometry is laid out in machine coordinates, so it is shifted back by the hinge offset.
    <group ref={hinge} position={[0, LID_Y, zBack]}>
      {/* No shadow from the lid, or the rings under the windows would be unreadable. */}
      <mesh geometry={lid} material={materials.crinklePaint} position-z={-zBack} receiveShadow />
      <mesh
        material={materials.nickel}
        position={[0, lidThickness + 0.15, DEPTH - 0.35]}
        onClick={(event) => {
          event.stopPropagation()
          setInnerLidOpen(!isOpen)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.2, 0.3, 0.5]} />
      </mesh>
    </group>
  )
}

/** Compartment over the rotors: walls, inner lid, rotors, reflector and entry wheel. */
export function RotorHousing() {
  const model = useEnigma((s) => s.model)
  const count = useEnigma((s) => s.slots.length)
  const rotors = useMemo(() => rotorsOf(model), [model])
  const reflectors = MODELS[model].reflectors
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
      <InnerLid count={count} />
      {/* Entry wheel (Eintrittswalze): fixed, right of the rotors. */}
      <mesh material={materials.steel} position={[rotorX(count - 1, count) + END_WHEEL.gap - 0.35, ROTOR.axleY, CENTER.z]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[END_WHEEL.radius, END_WHEEL.radius, END_WHEEL.width, 48]} />
      </mesh>
      {rotors.map((id, home) => (
        <Rotor key={id} id={id} home={home} homeCount={rotors.length} />
      ))}
      {reflectors.map((id, home) => (
        <Reflector key={id} id={id} home={home} homeCount={reflectors.length} />
      ))}
    </group>
  )
}
