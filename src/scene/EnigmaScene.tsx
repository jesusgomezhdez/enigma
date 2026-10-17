import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useEffect } from 'react'
import { useEnigma } from '../state/enigmaStore'
import { Case } from './Case'
import { Keyboard } from './Keyboard'
import { Lampboard } from './Lampboard'
import { PLATE_Y } from './layout'
import { materials } from './materials'
import { RotorHousing } from './RotorHousing'

/** Keeps the camera still while the hands are on the machine: a key held down or a thumbwheel. */
function OrbitLock() {
  const controls = useThree((state) => state.controls) as { enabled: boolean; enableZoom: boolean } | null
  useEffect(() => {
    if (!controls) return
    // Subscribing outside React disables the controls in the same tick as the press.
    return useEnigma.subscribe((state) => {
      controls.enabled = state.pressedBy !== 'pointer' && state.grabbedRotor === null
      // The mouse wheel turns a thumbwheel instead of zooming while over it.
      controls.enableZoom = state.hoveredRotor === null
    })
  }, [controls])
  return null
}

function Studio() {
  return (
    <>
      <color attach="background" args={['#14110e']} />
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[18, 45, 25]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Procedural environment: soft reflections on the nickel without downloading an HDRI. */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0, 10, 6]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1} position={[-10, 4, -4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="circle" intensity={0.6} position={[8, 6, -8]} scale={4} />
      </Environment>
      <mesh material={materials.table} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[400, 400]} />
      </mesh>
      <ContactShadows position-y={0.02} scale={70} blur={2.5} opacity={0.6} far={20} />
    </>
  )
}

export function EnigmaScene() {
  return (
    <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: [0, 42, 34], fov: 35, near: 1, far: 600 }}>
      <Studio />
      <group>
        <Case />
        <Keyboard />
        <Lampboard />
        <RotorHousing />
      </group>
      <OrbitControls
        makeDefault
        target={[0, PLATE_Y, 0]}
        enablePan={false}
        minDistance={25}
        maxDistance={110}
        minPolarAngle={0.1}
        maxPolarAngle={1.05}
        enableDamping
      />
      <OrbitLock />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} radius={0.6} />
      </EffectComposer>
    </Canvas>
  )
}
