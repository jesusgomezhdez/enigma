import { ExtrudeGeometry, Path, Shape } from 'three'

export type Hole = { kind: 'circle'; x: number; z: number; radius: number } | { kind: 'rect'; x: number; z: number; width: number; depth: number }

/**
 * A flat plate lying on the XZ plane, centred on (centerX, centerZ), with holes cut through it.
 * The geometry starts at y = 0 and is `thickness` tall. Hole coordinates are in world XZ.
 */
export function plateWithHoles(
  width: number,
  depth: number,
  thickness: number,
  holes: readonly Hole[],
  center: { x: number; z: number } = { x: 0, z: 0 },
): ExtrudeGeometry {
  // Shape space (x, y) becomes world (x, -z) once rotated flat, so z is negated throughout.
  const shape = new Shape()
  const [left, right] = [center.x - width / 2, center.x + width / 2]
  const [near, far] = [-(center.z + depth / 2), -(center.z - depth / 2)]
  shape.moveTo(left, near)
  shape.lineTo(right, near)
  shape.lineTo(right, far)
  shape.lineTo(left, far)
  shape.closePath()

  for (const hole of holes) {
    const path = new Path()
    if (hole.kind === 'circle') {
      path.absarc(hole.x, -hole.z, hole.radius, 0, Math.PI * 2, true)
    } else {
      const [x0, x1] = [hole.x - hole.width / 2, hole.x + hole.width / 2]
      const [y0, y1] = [-hole.z - hole.depth / 2, -hole.z + hole.depth / 2]
      path.moveTo(x0, y0)
      path.lineTo(x0, y1)
      path.lineTo(x1, y1)
      path.lineTo(x1, y0)
      path.closePath()
    }
    shape.holes.push(path)
  }

  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 32 })
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

/**
 * Serrated thumbwheel: a gear profile extruded along x, centred on the origin.
 * Flat-topped teeth so the thumb gets a grip, one per rotor step.
 */
export function thumbwheelGeometry(radius: number, width: number, teeth: number, toothDepth = 0.18): ExtrudeGeometry {
  const shape = new Shape()
  const pitch = (Math.PI * 2) / teeth
  const inner = radius - toothDepth
  const point = (r: number, angle: number) => [r * Math.cos(angle), r * Math.sin(angle)] as const
  shape.moveTo(...point(radius, 0))
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch
    shape.lineTo(...point(radius, a + pitch * 0.45))
    shape.lineTo(...point(inner, a + pitch * 0.55))
    shape.lineTo(...point(inner, a + pitch * 0.95))
    shape.lineTo(...point(radius, a + pitch))
  }

  const geometry = new ExtrudeGeometry(shape, { depth: width, bevelEnabled: false })
  geometry.translate(0, 0, -width / 2)
  geometry.rotateY(Math.PI / 2)
  return geometry
}
