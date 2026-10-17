import { usePhysicalKeyboard } from './hooks/usePhysicalKeyboard'
import { EnigmaScene } from './scene/EnigmaScene'
import { Tape } from './ui/Tape'
import { Toolbar } from './ui/Toolbar'

function App() {
  usePhysicalKeyboard()

  return (
    <main className="app">
      <EnigmaScene />
      <header className="title">
        <h1>Enigma I</h1>
        <p>Escribe con tu teclado o pulsa las teclas. Gira los rotores con su rueda y conecta cables en el tablero.</p>
      </header>
      <Toolbar />
      <Tape />
    </main>
  )
}

export default App
