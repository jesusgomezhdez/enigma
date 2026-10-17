import { useCursor } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Mesh, Plane, Raycaster, Vector2, Vector3, type BufferGeometry } from 'three'
import type { Letter } from '../engine'
import { partnerOf, useEnigma } from '../state/enigmaStore'
import { cableGeometry } from './cable'
import { labelTexture } from './labelTexture'
import { CASE, PLATE_Y, PLUG_FRONT_Z, PLUGBOARD, qwertzGrid } from './layout'
import { materials } from './materials'

interface SocketCell {
  letter: Letter
  x: number
  y: number
}

const SOCKETS: SocketCell[] = qwertzGrid(PLUGBOARD.rowsY, PLUGBOARD.pitch).map(({ letter, x, z }) => ({ letter, x, y: z }))
const SOCKET_BY_LETTER = new Map(SOCKETS.map((socket) => [socket.letter, socket]))
const LABEL_FACE = { foreground: '#e6dcc4', background: '#161616', scale: 0.7 }
const PANEL = { top: PLATE_Y - 0.3, bottom: CASE.wall, width: CASE.width - 2 * CASE.wall }
const DROP_RADIUS = 1.2
const DRAG_PLANE = new Plane(new Vector3(0, 0, 1), -PLUG_FRONT_Z)

const plugFace = (letter: Letter) => {
  const socket = SOCKET_BY_LETTER.get(letter)!
  return new Vector3(socket.x, socket.y, PLUG_FRONT_Z)
}

/** Nearest free socket to a point on the plugboard plane, if close enough to drop a plug in. */
function freeSocketNear(point: Vector3, plugboard: readonly string[], anchor: Letter): Letter | null {
  let best: Letter | null = null
  let bestDistance = DROP_RADIUS
  for (const socket of SOCKETS) {
    if (socket.letter === anchor || partnerOf(plugboard, socket.letter) !== null) continue
    const distance = Math.hypot(socket.x - point.x, socket.y - point.y)
    if (distance < bestDistance) {
      best = socket.letter
      bestDistance = distance
    }
  }
  return best
}

function Plug({ position }: { position: Vector3 }) {
  return (
    <mesh material={materials.bakelite} position={[position.x, position.y, position.z - PLUGBOARD.plugLength / 2]} rotation-x={Math.PI / 2} castShadow>
      <cylinderGeometry args={[0.42, 0.46, PLUGBOARD.plugLength, 20]} />
    </mesh>
  )
}

function Cable({ from, to }: { from: Letter; to: Letter }) {
  const geometry = useMemo(() => cableGeometry(plugFace(from), plugFace(to)), [from, to])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group>
      <mesh geometry={geometry} material={materials.cable} castShadow />
      <Plug position={plugFace(from)} />
      <Plug position={plugFace(to)} />
    </group>
  )
}

/** The cable being dragged: one end in its socket, the other following the pointer. */
function LooseCable({ anchor, pointer }: { anchor: Letter; pointer: RefObject<Vector3> }) {
  const cable = useRef<Mesh>(null)
  const plug = useRef<Mesh>(null)
  const drawn = useRef(new Vector3(Infinity, 0, 0))

  useFrame(() => {
    const end = pointer.current
    if (drawn.current.equals(end)) return
    drawn.current.copy(end)
    const previous: BufferGeometry = cable.current!.geometry
    cable.current!.geometry = cableGeometry(plugFace(anchor), end.clone())
    previous.dispose()
    plug.current!.position.set(end.x, end.y, end.z - PLUGBOARD.plugLength / 2)
  })

  return (
    <group>
      <mesh ref={cable} material={materials.cable} castShadow />
      <Plug position={plugFace(anchor)} />
      <mesh ref={plug} material={materials.bakelite} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.42, 0.46, PLUGBOARD.plugLength, 20]} />
      </mesh>
    </group>
  )
}

interface SocketProps extends SocketCell {
  isTarget: boolean
  onGrab: (letter: Letter, event: ThreeEvent<PointerEvent>) => void
}

function Socket({ letter, x, y, isTarget, onGrab }: SocketProps) {
  const [hovered, setHovered] = useState(false)
  const label = useMemo(() => labelTexture(letter, LABEL_FACE), [letter])
  useCursor(hovered, 'grab')
  const { z, socketRadius, socketDepth } = PLUGBOARD

  return (
    <group position={[x, y, z]}>
      <mesh
        material={materials.bakelite}
        position-z={socketDepth / 2}
        rotation-x={Math.PI / 2}
        onPointerDown={(event) => onGrab(letter, event)}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[socketRadius, socketRadius, socketDepth, 24]} />
      </mesh>
      {/* Two holes: the thick and the thin pin of the plug. */}
      {[
        [0.2, 0.13],
        [-0.2, 0.09],
      ].map(([holeY, radius]) => (
        <mesh key={holeY} position={[0, holeY, socketDepth + 0.002]}>
          <circleGeometry args={[radius, 16]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 0.01]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial map={label} roughness={0.85} />
      </mesh>
      {isTarget && (
        <mesh position-z={socketDepth + 0.02}>
          <torusGeometry args={[socketRadius + 0.08, 0.06, 8, 32]} />
          <meshStandardMaterial color="#ffc864" emissive="#ffc864" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

/** Steckerbrett: the front panel with 26 sockets and the cables plugged into it. */
export function Plugboard() {
  const plugboard = useEnigma((s) => s.machine.plugboard)
  const anchor = useEnigma((s) => s.cableDrag)
  const [target, setTarget] = useState<Letter | null>(null)
  const pointer = useRef(new Vector3())
  const stopDragging = useRef<(() => void) | null>(null)
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const raycast = useMemo(() => ({ raycaster: new Raycaster(), ndc: new Vector2() }), [])
  useEffect(() => () => stopDragging.current?.(), [])

  /** Projects the pointer onto the plane of the plug faces, kept inside the cable recess. */
  const projectPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    raycast.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycast.raycaster.setFromCamera(raycast.ndc, camera)
    const hit = raycast.raycaster.ray.intersectPlane(DRAG_PLANE, new Vector3())
    if (!hit) return
    const halfWidth = PANEL.width / 2 - 0.6
    pointer.current.set(Math.min(halfWidth, Math.max(-halfWidth, hit.x)), Math.min(PANEL.top, Math.max(PANEL.bottom + 0.6, hit.y)), PLUG_FRONT_Z)
  }

  const onGrab = (letter: Letter, event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const { grabSocket, dropCable } = useEnigma.getState()
    grabSocket(letter)
    const dragged = useEnigma.getState().cableDrag
    if (dragged === null) return

    projectPointer(event.nativeEvent.clientX, event.nativeEvent.clientY)
    const onMove = (move: PointerEvent) => {
      projectPointer(move.clientX, move.clientY)
      setTarget(freeSocketNear(pointer.current, useEnigma.getState().machine.plugboard, dragged))
    }
    const onUp = () => {
      dropCable(freeSocketNear(pointer.current, useEnigma.getState().machine.plugboard, dragged))
      setTarget(null)
      stopDragging.current?.()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    stopDragging.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      stopDragging.current = null
    }
  }

  return (
    <group>
      <mesh material={materials.crinklePaint} position={[0, (PANEL.top + PANEL.bottom) / 2, PLUGBOARD.z - 0.15]} receiveShadow>
        <boxGeometry args={[PANEL.width, PANEL.top - PANEL.bottom, 0.3]} />
      </mesh>
      {SOCKETS.map((socket) => (
        <Socket key={socket.letter} {...socket} isTarget={socket.letter === target} onGrab={onGrab} />
      ))}
      {plugboard.map((pair) => (
        <Cable key={pair} from={pair[0]} to={pair[1]} />
      ))}
      {anchor !== null && <LooseCable anchor={anchor} pointer={pointer} />}
    </group>
  )
}
