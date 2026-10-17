import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo } from 'react'
import { Color, MeshStandardMaterial } from 'three'
import { useEnigma } from '../state/enigmaStore'
import { labelTexture } from './labelTexture'
import { LAMPBOARD, PLATE_Y, qwertzGrid, type GridCell } from './layout'
import { materials } from './materials'
import { plateWithHoles } from './plate'

const BULB_COLOR = new Color('#ffc864')
const LIT_INTENSITY = 5
const COVER_THICKNESS = 0.15
const MARGIN = 1.6
const LAMPS = qwertzGrid(LAMPBOARD.rowsZ, LAMPBOARD.pitch)
const SIZE = { width: 9 * LAMPBOARD.pitch + MARGIN, depth: LAMPBOARD.rowsZ[2] - LAMPBOARD.rowsZ[0] + 2 * MARGIN }
const CENTER = { x: 0, z: (LAMPBOARD.rowsZ[0] + LAMPBOARD.rowsZ[2]) / 2 }

function Lamp({ letter, x, z }: GridCell) {
  const isLit = useEnigma((s) => s.litLamp === letter)
  const glass = useMemo(() => {
    const window = labelTexture(letter, { foreground: '#f4ecd6', background: '#2a2926', scale: 0.55 })
    // toneMapped off so a lit window exceeds 1.0 and only it feeds the bloom pass.
    return new MeshStandardMaterial({ map: window, emissiveMap: window, emissive: BULB_COLOR, emissiveIntensity: 0, roughness: 0.15, toneMapped: false })
  }, [letter])

  useFrame((_, delta) => {
    // The filament heats almost instantly and fades out a little slower.
    easing.damp(glass, 'emissiveIntensity', isLit ? LIT_INTENSITY : 0, isLit ? 0.015 : 0.08, delta)
  })

  return (
    <mesh material={glass} position={[x, PLATE_Y + LAMPBOARD.height - COVER_THICKNESS - 0.04, z]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[LAMPBOARD.windowRadius + 0.1, 32]} />
    </mesh>
  )
}

export function Lampboard() {
  const cover = useMemo(
    () =>
      plateWithHoles(
        SIZE.width,
        SIZE.depth,
        COVER_THICKNESS,
        LAMPS.map(({ x, z }) => ({ kind: 'circle' as const, x, z, radius: LAMPBOARD.windowRadius })),
        CENTER,
      ),
    [],
  )

  const bodyHeight = LAMPBOARD.height - COVER_THICKNESS - 0.05
  return (
    <group>
      <mesh material={materials.crinklePaint} position={[CENTER.x, PLATE_Y + bodyHeight / 2, CENTER.z]} receiveShadow>
        <boxGeometry args={[SIZE.width, bodyHeight, SIZE.depth]} />
      </mesh>
      <mesh geometry={cover} material={materials.crinklePaint} position-y={PLATE_Y + LAMPBOARD.height - COVER_THICKNESS} castShadow receiveShadow />
      {LAMPS.map((lamp) => (
        <Lamp key={lamp.letter} {...lamp} />
      ))}
    </group>
  )
}
