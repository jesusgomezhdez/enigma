import { useState } from 'react'
import { useEnigma } from '../state/enigmaStore'

/** Radio operators wrote messages in groups of five letters. */
function groupsOfFive(text: string): string {
  return text.match(/.{1,5}/g)?.join(' ') ?? ''
}

/** The operator's notepad: what was typed and which lamps lit up, as on a radio message form. */
export function Tape() {
  const tape = useEnigma((s) => s.tape)
  const litLamp = useEnigma((s) => s.litLamp)
  const clearTape = useEnigma((s) => s.clearTape)
  const [copied, setCopied] = useState(false)

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(groupsOfFive(tape.output))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the text is still on screen to copy by hand.
    }
  }

  return (
    <section className="tape" aria-label="Libreta del operador">
      <dl>
        <dt>Entrada</dt>
        <dd>{groupsOfFive(tape.input) || '—'}</dd>
        <dt>Lámparas</dt>
        <dd>{groupsOfFive(tape.output) || '—'}</dd>
      </dl>
      <div className="tape-actions">
        <span className="count">{tape.output.length} letras</span>
        <button type="button" onClick={copyOutput} disabled={!tape.output}>
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button type="button" onClick={clearTape} disabled={!tape.input}>
          Borrar
        </button>
      </div>
      <p className="visually-hidden" aria-live="assertive">
        {litLamp ?? ''}
      </p>
    </section>
  )
}
