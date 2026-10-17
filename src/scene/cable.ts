import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { CASE } from './layout'

const CABLE_RADIUS = 0.11
// Above the lip of the folded-down front flap, so a long cable never disappears behind it.
const LOWEST_Y = CASE.wall + 1.3
// Cables bulge out a little, but stay behind the closed front flap.
const BULGE = 0.55

/** A hanging plugboard cable between two plug faces: it drops out of each plug and sags in between. */
export function cableGeometry(from: Vector3, to: Vector3): TubeGeometry {
  const sag = 0.6 + from.distanceTo(to) * 0.2
  const lowest = Math.max(LOWEST_Y, Math.min(from.y, to.y) - sag)
  const curve = new CatmullRomCurve3([
    from,
    new Vector3(from.x, from.y - 0.7, from.z + BULGE * 0.6),
    new Vector3((from.x + to.x) / 2, lowest, Math.max(from.z, to.z) + BULGE),
    new Vector3(to.x, to.y - 0.7, to.z + BULGE * 0.6),
    to,
  ])
  return new TubeGeometry(curve, 64, CABLE_RADIUS, 8, false)
}
