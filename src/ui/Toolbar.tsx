import { CABLES_ISSUED, useEnigma, type ViewId } from '../state/enigmaStore'

const VIEW_LABELS: Record<ViewId, string> = {
  machine: 'Máquina',
  rotors: 'Rotores',
  plugboard: 'Clavijas',
}

/** Camera shortcuts and the cable box. */
export function Toolbar() {
  const view = useEnigma((s) => s.view)
  const setView = useEnigma((s) => s.setView)
  const plugboard = useEnigma((s) => s.machine.plugboard)

  return (
    <nav className="toolbar" aria-label="Vistas">
      <div className="views" role="group">
        {(Object.keys(VIEW_LABELS) as ViewId[]).map((id) => (
          <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>
            {VIEW_LABELS[id]}
          </button>
        ))}
      </div>
      <p className="cables" title={plugboard.join(' ') || 'Sin cables'}>
        Cables {plugboard.length}/{CABLES_ISSUED}
        {plugboard.length > 0 && <span>{plugboard.join(' ')}</span>}
      </p>
    </nav>
  )
}
