import { Vector3 } from 'three'
import type { ViewId } from '../state/enigmaStore'
import { PLATE_Y, ROTOR_HOUSING } from './layout'

interface View {
  position: Vector3
  target: Vector3
}

export const VIEWS: Record<ViewId, View> = {
  machine: { position: new Vector3(0, 42, 34), target: new Vector3(0, PLATE_Y, 0) },
  rotors: { position: new Vector3(0, 30, 4), target: new Vector3(0, PLATE_Y, (ROTOR_HOUSING.zFront + ROTOR_HOUSING.zBack) / 2) },
  // Covers the open rotor compartment and the parts boxes on the right.
  interior: { position: new Vector3(13, 58, 30), target: new Vector3(13, 4, -2) },
  plugboard: { position: new Vector3(0, 13, 44), target: new Vector3(0, 5, 12) },
}
