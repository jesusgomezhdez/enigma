import { formatRingLabel, MODELS } from '../engine'
import { CABLES_ISSUED, useEnigma, type ViewId } from '../state/enigmaStore'

const VIEW_LABELS: Record<ViewId, string> = {
  machine: 'Máquina',
  rotors: 'Rotores',
  interior: 'Interior',
  plugboard: 'Clavijas',
}

/** Camera shortcuts and a summary of how the machine is set up, in key-sheet terms. */
export function Toolbar() {
  const view = useEnigma((s) => s.view)
  const setView = useEnigma((s) => s.setView)
  const model = useEnigma((s) => s.model)
  const slots = useEnigma((s) => s.slots)
  const rotors = useEnigma((s) => s.rotors)
  const reflector = useEnigma((s) => s.reflector)
  const plugboard = useEnigma((s) => s.plugboard)
  const caseOpen = useEnigma((s) => s.caseOpen)
  const setCaseOpen = useEnigma((s) => s.setCaseOpen)
  const soundOn = useEnigma((s) => s.soundOn)
  const setSoundOn = useEnigma((s) => s.setSoundOn)

  const ringStyle = MODELS[model].ringLabels
  const isComplete = reflector !== null && slots.every((slot) => slot !== null)
  const order = slots.map((id) => id ?? '—').join(' ')
  const rings = slots.map((id) => (id ? formatRingLabel(rotors[id].ring, ringStyle) : '—')).join(' ')

  return (
    <nav className="toolbar" aria-label="Vistas">
      <div className="views" role="group">
        {(Object.keys(VIEW_LABELS) as ViewId[]).map((id) => (
          <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
            {VIEW_LABELS[id]}
          </button>
        ))}
      </div>
      <div className="views" role="group">
        <button type="button" onClick={() => setCaseOpen(!caseOpen)}>
          {caseOpen ? 'Cerrar caja' : 'Abrir caja'}
        </button>
        <button type="button" aria-pressed={soundOn} onClick={() => setSoundOn(!soundOn)}>
          Sonido {soundOn ? 'sí' : 'no'}
        </button>
      </div>
      <dl className="setup">
        <dt>UKW</dt>
        <dd>{reflector?.replace('-thin', ' fina') ?? '—'}</dd>
        <dt>Walzenlage</dt>
        <dd>{order}</dd>
        <dt>Ringstellung</dt>
        <dd>{rings}</dd>
        <dt>
          Stecker {plugboard.length}/{CABLES_ISSUED}
        </dt>
        <dd>{plugboard.join(' ') || '—'}</dd>
      </dl>
      {caseOpen && !isComplete && (
        <p className="warning" role="status">
          Falta {reflector === null ? 'el reflector' : 'un rotor'}: el circuito está abierto.
        </p>
      )}
    </nav>
  )
}
