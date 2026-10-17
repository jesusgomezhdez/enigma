import { useMemo } from 'react'
import { MODELS } from '../engine'
import { rotorsOf, useEnigma } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { boxSlotX, REFLECTOR_BOX, ROTOR_BOX } from './layout'
import { materials } from './materials'

const WALL = 0.5
const TAG = { width: 1.4, height: WALL - 0.1 }
const TAG_FACE = { foreground: '#2a1d14', background: '#d9cfb4', scale: 0.75, aspect: TAG.width / TAG.height }

interface BoxProps {
  box: { x: number; z: number; pitch: number; depth: number; wallHeight: number }
  names: readonly string[]
}

/** Open wooden tray with a paper tag in front of each place, so every part has its home. */
function Tray({ box, names }: BoxProps) {
  const width = names.length * box.pitch + 1.6
  const tags = useMemo(() => names.map((name) => labelTexture(name.replace('-thin', ''), TAG_FACE)), [names])
  const walls: { position: [number, number, number]; size: [number, number, number] }[] = [
    { position: [box.x, box.wallHeight / 2, box.z - box.depth / 2 + WALL / 2], size: [width, box.wallHeight, WALL] },
    { position: [box.x, box.wallHeight / 2, box.z + box.depth / 2 - WALL / 2], size: [width, box.wallHeight, WALL] },
    { position: [box.x - width / 2 + WALL / 2, box.wallHeight / 2, box.z], size: [WALL, box.wallHeight, box.depth] },
    { position: [box.x + width / 2 - WALL / 2, box.wallHeight / 2, box.z], size: [WALL, box.wallHeight, box.depth] },
  ]

  return (
    <group>
      <mesh material={materials.wood} position={[box.x, 0.25, box.z]} receiveShadow>
        <boxGeometry args={[width, 0.5, box.depth]} />
      </mesh>
      {walls.map(({ position, size }, i) => (
        <mesh key={i} material={materials.wood} position={position} castShadow receiveShadow>
          <boxGeometry args={size} />
        </mesh>
      ))}
      {tags.map((texture, i) => (
        <mesh key={names[i]} position={[boxSlotX(box, i, names.length), box.wallHeight + 0.01, box.z + box.depth / 2 - WALL / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[TAG.width, TAG.height]} />
          <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Rotor box (Walzenkasten) and reflector box, next to the machine. */
export function PartsBoxes() {
  const model = useEnigma((s) => s.model)
  const rotors = useMemo(() => rotorsOf(model), [model])
  return (
    <group>
      <Tray box={ROTOR_BOX} names={rotors} />
      <Tray box={REFLECTOR_BOX} names={MODELS[model].reflectors} />
    </group>
  )
}
