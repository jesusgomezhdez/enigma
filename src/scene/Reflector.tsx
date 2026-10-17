import { useCursor } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef, useState } from 'react'
import { Vector3, type Group } from 'three'
import type { ReflectorId } from '../engine'
import { useEnigma } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { isClick } from './isClick'
import { boxSlotX, END_WHEEL, REFLECTOR_BOX, ROTOR, ROTOR_HOUSING_CENTER_Z, rotorX } from './layout'
import { materials } from './materials'

const TAG_FACE = { foreground: '#e9e1cc', background: '#3a3a38', scale: 0.55 }
const MAX_LIFT = 9

interface ReflectorProps {
  id: ReflectorId
  home: number
  homeCount: number
}

/** A reflector (UKW): sits left of the rotors, or waits in its box. One click swaps it. */
export function Reflector({ id, home, homeCount }: ReflectorProps) {
  const travel = useRef<Group>(null)
  const place = useRef<Vector3 | null>(null)
  const [hovered, setHovered] = useState(false)
  const lidOpen = useEnigma((s) => s.innerLidOpen)
  const installed = useEnigma((s) => s.reflector === id)
  const slotFree = useEnigma((s) => s.reflector === null)
  const canMove = lidOpen && (installed || slotFree)
  useCursor(hovered && canMove)

  const tag = useMemo(() => labelTexture(id.replace('-thin', ''), TAG_FACE), [id])
  const homePlace = useMemo(() => new Vector3(boxSlotX(REFLECTOR_BOX, home, homeCount), REFLECTOR_BOX.axleY, REFLECTOR_BOX.z), [home, homeCount])

  useFrame((_, delta) => {
    const state = useEnigma.getState()
    const target =
      state.reflector === id ? new Vector3(rotorX(0, state.slots.length) - END_WHEEL.gap, ROTOR.axleY, ROTOR_HOUSING_CENTER_Z) : homePlace
    if (place.current === null) place.current = target.clone()
    easing.damp3(place.current, target, 0.3, delta)
    const lift = Math.min(place.current.distanceTo(target) * 0.8, MAX_LIFT)
    travel.current!.position.set(place.current.x, place.current.y + lift, place.current.z)
  })

  return (
    <group
      ref={travel}
      onClick={(event) => {
        if (!isClick(event)) return
        const { removeReflector, installReflector } = useEnigma.getState()
        if (installed) removeReflector()
        else installReflector(id)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh material={materials.steel} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[END_WHEEL.radius, END_WHEEL.radius, END_WHEEL.width, 48]} />
      </mesh>
      <mesh position-y={END_WHEEL.radius + 0.005} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[END_WHEEL.width - 0.1, END_WHEEL.width - 0.1]} />
        <meshStandardMaterial map={tag} roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  )
}
