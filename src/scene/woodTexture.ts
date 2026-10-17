import { CanvasTexture, SRGBColorSpace } from 'three'

interface WoodPalette {
  base: string
  dark: string
  light: string
}

export const OAK: WoodPalette = { base: '#5b3920', dark: '#3a2311', light: '#74492a' }
export const OAK_DARK: WoodPalette = { base: '#3f2714', dark: '#2a180b', light: '#52331c' }

/** Small deterministic PRNG so the grain is the same on every load. */
function random(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Long wavy streaks along x: the grain of a sawn board. */
function paintGrain(context: CanvasRenderingContext2D, width: number, height: number, palette: WoodPalette, seed: number) {
  const next = random(seed)
  context.fillStyle = palette.base
  context.fillRect(0, 0, width, height)
  for (let i = 0; i < height / 5; i++) {
    const y = next() * height
    const amplitude = 2 + next() * 10
    const wavelength = 200 + next() * 600
    const phase = next() * Math.PI * 2
    context.strokeStyle = next() > 0.5 ? palette.dark : palette.light
    context.globalAlpha = 0.08 + next() * 0.22
    context.lineWidth = 1 + next() * 5
    context.beginPath()
    for (let x = 0; x <= width; x += 16) {
      const wave = y + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
      if (x === 0) context.moveTo(x, wave)
      else context.lineTo(x, wave)
    }
    context.stroke()
  }
  context.globalAlpha = 1
}

function canvasTexture(canvas: HTMLCanvasElement, color: boolean): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  if (color) texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

export function woodTexture(palette: WoodPalette, seed = 7): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  paintGrain(canvas.getContext('2d')!, canvas.width, canvas.height, palette, seed)
  return canvasTexture(canvas, true)
}

/**
 * Colour and bump maps for the outside of the case lid, with a title carved into the wood.
 * `aspect` is width / depth of the lid, so the letters are not stretched.
 */
export function carvedLidTextures(title: string, aspect: number) {
  const width = 2048
  const height = Math.round(width / aspect)
  const [colour, bump] = [document.createElement('canvas'), document.createElement('canvas')]
  for (const canvas of [colour, bump]) {
    canvas.width = width
    canvas.height = height
  }

  const titleFont = `bold ${Math.round(height * 0.15)}px Georgia, "Times New Roman", serif`
  const titleY = height * 0.5
  const frame = { x: width * 0.08, y: height * 0.12, w: width * 0.84, h: height * 0.76 }

  const carve = (context: CanvasRenderingContext2D, ink: string) => {
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = titleFont
    context.letterSpacing = `${Math.round(width * 0.018)}px`
    context.fillStyle = ink
    // maxWidth keeps the title inside the frame whatever font the system falls back to.
    context.fillText(title, width / 2, titleY, frame.w * 0.86)
    context.strokeStyle = ink
    context.lineWidth = width * 0.004
    context.strokeRect(frame.x, frame.y, frame.w, frame.h)
  }

  // Colour: grain, a light edge where the cut catches the light, then the dark floor of the cut.
  const paint = colour.getContext('2d')!
  paintGrain(paint, width, height, OAK, 11)
  paint.save()
  paint.translate(width * 0.0015, height * 0.002)
  carve(paint, 'rgba(255, 214, 160, 0.28)')
  paint.restore()
  paint.globalAlpha = 0.88
  carve(paint, '#24140a')
  paint.globalAlpha = 1

  // Bump: white surface, soft dark grooves so the edges of the letters read as bevelled.
  const relief = bump.getContext('2d')!
  relief.fillStyle = '#fff'
  relief.fillRect(0, 0, width, height)
  relief.filter = 'blur(3px)'
  carve(relief, '#000')

  return { map: canvasTexture(colour, true), bumpMap: canvasTexture(bump, false) }
}
