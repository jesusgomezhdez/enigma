import { CASE, PLATE_Y } from './layout'
import { materials } from './materials'

const LID_OPEN_ANGLE = -(100 * Math.PI) / 180

/** Wooden transport case with its lid swung open, plus the black top plate. */
export function Case() {
  const { width, depth, height, wall, lidThickness } = CASE
  const inner = { width: width - 2 * wall, depth: depth - 2 * wall }

  return (
    <group>
      <mesh material={materials.wood} position={[0, wall / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, wall, depth]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`x${side}`} material={materials.wood} position={[(side * (width - wall)) / 2, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wall, height, depth]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`z${side}`} material={materials.wood} position={[0, height / 2, (side * (depth - wall)) / 2]} castShadow receiveShadow>
          <boxGeometry args={[inner.width, height, wall]} />
        </mesh>
      ))}

      <mesh material={materials.crinklePaint} position={[0, PLATE_Y - 0.15, 0]} receiveShadow>
        <boxGeometry args={[inner.width, 0.3, inner.depth]} />
      </mesh>

      <group position={[0, height, -depth / 2]} rotation-x={LID_OPEN_ANGLE}>
        <mesh material={materials.wood} position={[0, lidThickness / 2, depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width, lidThickness, depth]} />
        </mesh>
        <mesh material={materials.woodDark} position={[0, -0.01, depth / 2]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[width - 3, depth - 3]} />
        </mesh>
      </group>
    </group>
  )
}
