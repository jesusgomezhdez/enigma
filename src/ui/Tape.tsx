import { useEnigma } from '../state/enigmaStore'

/** Radio operators wrote messages in groups of five letters. */
function groupsOfFive(text: string): string {
  return text.match(/.{1,5}/g)?.join(' ') ?? ''
}

/** The operator's notepad: what was typed and which lamps lit up. */
export function Tape() {
  const tape = useEnigma((s) => s.tape)
  const litLamp = useEnigma((s) => s.litLamp)
  const clearTape = useEnigma((s) => s.clearTape)

  return (
    <section className="tape" aria-label="Libreta del operador">
      <dl>
        <dt>Entrada</dt>
        <dd>{groupsOfFive(tape.input) || '—'}</dd>
        <dt>Lámparas</dt>
        <dd>{groupsOfFive(tape.output) || '—'}</dd>
      </dl>
      <button type="button" onClick={clearTape} disabled={!tape.input}>
        Borrar
      </button>
      <p className="visually-hidden" aria-live="assertive">
        {litLamp ?? ''}
      </p>
    </section>
  )
}
