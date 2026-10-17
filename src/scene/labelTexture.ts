import { CanvasTexture, SRGBColorSpace } from 'three'

interface LabelStyle {
  foreground: string
  background: string
  /** Font size relative to the texture size. */
  scale?: number
}

const SIZE = 128
const FONT_FAMILY = '"DIN Alternate", "Arial Narrow", Arial, sans-serif'
const cache = new Map<string, CanvasTexture>()

/** Draws a printed label (key, lamp, rotor ring) into a cached texture. No font files needed. */
export function labelTexture(text: string, { foreground, background, scale = 0.62 }: LabelStyle): CanvasTexture {
  const id = `${text}|${foreground}|${background}|${scale}`
  const cached = cache.get(id)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const context = canvas.getContext('2d')!
  context.fillStyle = background
  context.fillRect(0, 0, SIZE, SIZE)
  context.fillStyle = foreground
  context.font = `bold ${Math.round(SIZE * scale)}px ${FONT_FAMILY}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, SIZE / 2, SIZE / 2 + SIZE * 0.04)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  cache.set(id, texture)
  return texture
}
