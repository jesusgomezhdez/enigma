import { MeshStandardMaterial } from 'three'

/** Shared materials: one instance each, reused by every part. */
export const materials = {
  wood: new MeshStandardMaterial({ color: '#5b3920', roughness: 0.55 }),
  woodDark: new MeshStandardMaterial({ color: '#3f2714', roughness: 0.6 }),
  crinklePaint: new MeshStandardMaterial({ color: '#161616', roughness: 0.85, metalness: 0.15 }),
  bakelite: new MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.35 }),
  ivory: new MeshStandardMaterial({ color: '#e7dfc9', roughness: 0.55 }),
  nickel: new MeshStandardMaterial({ color: '#b8b6b0', roughness: 0.28, metalness: 1 }),
  steel: new MeshStandardMaterial({ color: '#5e5e5c', roughness: 0.45, metalness: 0.9 }),
  table: new MeshStandardMaterial({ color: '#2a1d14', roughness: 0.8 }),
}
