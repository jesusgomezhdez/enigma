/**
 * Mechanical sounds synthesised with the Web Audio API: filtered noise bursts for clicks and
 * pitched sine drops for thumps. Nothing to download and no licences to track.
 */

let context: AudioContext | null = null
let noise: AudioBuffer | null = null

function audio(): AudioContext | null {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise) return noise
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

interface Click {
  /** Centre of the band-pass filter, in Hz: higher sounds smaller and harder. */
  frequency: number
  duration: number
  gain: number
  delay?: number
}

function click({ frequency, duration, gain, delay = 0 }: Click) {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime + delay
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer(ctx)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = frequency * (0.92 + Math.random() * 0.16)
  filter.Q.value = 3
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(gain, start)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter).connect(envelope).connect(ctx.destination)
  source.start(start, Math.random() * 0.5, duration)
}

function thump({ frequency, duration, gain, delay = 0 }: Click) {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime + delay
  const oscillator = ctx.createOscillator()
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, start + duration)
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(gain, start)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(envelope).connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration)
}

export const sounds = {
  /** Key lever hitting the bottom of its travel. */
  keyDown: () => {
    click({ frequency: 2400, duration: 0.05, gain: 0.5 })
    thump({ frequency: 150, duration: 0.09, gain: 0.35 })
  },
  keyUp: () => click({ frequency: 3400, duration: 0.03, gain: 0.22 }),
  /** Stepping pawl advancing one rotor; `order` staggers the double step. */
  rotorStep: (order: number) => click({ frequency: 5200, duration: 0.025, gain: 0.25, delay: 0.012 + order * 0.018 }),
  /** Detent of a thumbwheel or a ring turned by hand. */
  detent: () => click({ frequency: 6000, duration: 0.018, gain: 0.16 }),
  plugIn: () => {
    thump({ frequency: 240, duration: 0.06, gain: 0.3 })
    click({ frequency: 1600, duration: 0.04, gain: 0.3 })
  },
  plugOut: () => click({ frequency: 1300, duration: 0.05, gain: 0.25 }),
  /** Rotor or reflector set down in the machine or in its box. */
  partSet: () => {
    click({ frequency: 2800, duration: 0.04, gain: 0.3, delay: 0.25 })
    thump({ frequency: 320, duration: 0.08, gain: 0.25, delay: 0.25 })
  },
  /** Wooden lid or flap swinging shut or open. */
  lid: (closing: boolean) => {
    thump({ frequency: closing ? 95 : 130, duration: 0.2, gain: closing ? 0.6 : 0.3, delay: closing ? 0.35 : 0 })
    click({ frequency: 900, duration: 0.08, gain: closing ? 0.25 : 0.12, delay: closing ? 0.35 : 0 })
  },
}
