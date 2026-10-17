import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { useEnigma } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { KEYBOARD, PLATE_Y, qwertzGrid, type GridCell } from './layout'
import { materials } from './materials'

const KEY_FACE = { foreground: '#111', background: '#ece6d6' }

function Key({ letter, x, z }: GridCell) {
  const cap = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const isDown = useEnigma((s) => s.pressedKey === letter)
  const isLocked = useEnigma((s) => s.pressedKey !== null && s.pressedKey !== letter)
  const pressKey = useEnigma((s) => s.pressKey)
  const face = useMemo(() => labelTexture(letter, KEY_FACE), [letter])
  useCursor(hovered && !isLocked)

  useFrame((_, delta) => {
    // Fast on the way down, a little slower on the spring return.
    easing.damp(cap.current!.position, 'y', isDown ? -KEYBOARD.travel : 0, isDown ? 0.025 : 0.05, delta)
  })

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    pressKey(letter, 'pointer')
  }

  const { capRadius, capHeight } = KEYBOARD
  return (
    <group position={[x, PLATE_Y, z]}>
      {/* Guide sleeve fixed to the plate; the lever stem travels with the cap. */}
      <mesh material={materials.steel} position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.5, 12]} />
      </mesh>
      <group
        ref={cap}
        onPointerDown={onPointerDown}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh material={materials.steel} position={[0, capHeight / 2, 0]}>
          <cylinderGeometry args={[0.12, 0.12, capHeight, 8]} />
        </mesh>
        <mesh material={materials.bakelite} position={[0, capHeight - 0.2, 0]} castShadow>
          <cylinderGeometry args={[capRadius, capRadius * 0.92, 0.4, 32]} />
        </mesh>
        <mesh material={materials.nickel} position={[0, capHeight, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[capRadius - 0.05, 0.08, 10, 40]} />
        </mesh>
        <mesh position={[0, capHeight + 0.005, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[capRadius - 0.1, 32]} />
          <meshStandardMaterial map={face} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

export function Keyboard() {
  const keys = useMemo(() => qwertzGrid(KEYBOARD.rowsZ, KEYBOARD.pitch), [])
  return (
    <group>
      {keys.map((key) => (
        <Key key={key.letter} {...key} />
      ))}
    </group>
  )
}
