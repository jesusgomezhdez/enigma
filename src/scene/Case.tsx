import { useCursor } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MeshStandardMaterial, type Group } from 'three'
import { useEnigma } from '../state/enigmaStore'
import { isClick } from './isClick'
import { CASE, FLAP, PLATE_Y, PLUGBOARD } from './layout'
import { materials } from './materials'
import { carvedLidTextures } from './woodTexture'

const INSCRIPTION = { title: 'ENIGMA', byline: 'By Jesús Gómez' }

const LID_OPEN_ANGLE = -(100 * Math.PI) / 180
const INNER = { width: CASE.width - 2 * CASE.wall, depth: CASE.depth - 2 * CASE.wall }
const INNER_BACK_Z = -INNER.depth / 2

/** Front flap of the case, hinged at the bottom. It folds down to uncover the plugboard. */
function FrontFlap() {
  const hinge = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const isOpen = useEnigma((s) => s.flapOpen)
  const setFlapOpen = useEnigma((s) => s.setFlapOpen)
  useCursor(hovered)

  useFrame((_, delta) => {
    easing.damp(hinge.current!.rotation, 'x', isOpen ? FLAP.openAngle : 0, 0.25, delta)
  })

  const { height, wall, depth } = CASE
  const flapHeight = height - wall
  return (
    <group ref={hinge} position={[0, wall, depth / 2]}>
      <group
        onClick={(event) => {
          if (!isClick(event)) return
          setFlapOpen(!isOpen)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh material={materials.wood} position={[0, flapHeight / 2, -wall / 2]} castShadow receiveShadow>
          <boxGeometry args={[INNER.width, flapHeight, wall]} />
        </mesh>
        {/* Latch: the hint that this panel opens. */}
        <mesh material={materials.nickel} position={[0, flapHeight - 1, 0.1]}>
          <boxGeometry args={[2.4, 0.6, 0.2]} />
        </mesh>
      </group>
    </group>
  )
}

/** Hinged at the back. Open it leans back past vertical; closed it rests on the walls. */
function CaseLid() {
  const hinge = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const isOpen = useEnigma((s) => s.caseOpen)
  const setCaseOpen = useEnigma((s) => s.setCaseOpen)
  const carved = useMemo(() => {
    const textures = carvedLidTextures(INSCRIPTION, CASE.width / CASE.depth)
    return new MeshStandardMaterial({ ...textures, bumpScale: 3, roughness: 0.55 })
  }, [])
  useEffect(() => () => carved.dispose(), [carved])
  useCursor(hovered)

  useFrame((_, delta) => {
    easing.damp(hinge.current!.rotation, 'x', isOpen ? LID_OPEN_ANGLE : 0, 0.3, delta)
  })

  const { width, depth, height, lidThickness } = CASE
  return (
    <group ref={hinge} position={[0, height, -depth / 2]}>
      <group
        onClick={(event) => {
          if (!isClick(event)) return
          setCaseOpen(!isOpen)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <mesh material={materials.wood} position={[0, lidThickness / 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width, lidThickness, depth]} />
        </mesh>
        {/* Outer face with the inscription; it faces up once the lid is shut. */}
        <mesh material={carved} position={[0, lidThickness + 0.003, depth / 2]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[width, depth]} />
        </mesh>
        <mesh material={materials.woodDark} position={[0, -0.01, depth / 2]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[width - 3, depth - 3]} />
        </mesh>
      </group>
    </group>
  )
}

/** Wooden transport case with its lid, front flap and the black top plate. */
export function Case() {
  const { width, depth, height, wall } = CASE
  // The top plate stops at the plugboard panel, leaving the cable recess behind the flap.
  const plateDepth = PLUGBOARD.z - INNER_BACK_Z

  return (
    <group>
      <mesh material={materials.wood} position={[0, wall / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, wall, depth]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} material={materials.wood} position={[(side * (width - wall)) / 2, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wall, height, depth]} />
        </mesh>
      ))}
      <mesh material={materials.wood} position={[0, height / 2, -(depth - wall) / 2]} castShadow receiveShadow>
        <boxGeometry args={[INNER.width, height, wall]} />
      </mesh>
      <FrontFlap />

      <mesh material={materials.crinklePaint} position={[0, PLATE_Y - 0.15, INNER_BACK_Z + plateDepth / 2]} receiveShadow>
        <boxGeometry args={[INNER.width, 0.3, plateDepth]} />
      </mesh>

      <CaseLid />
    </group>
  )
}
