import { usePhysicalKeyboard } from './hooks/usePhysicalKeyboard'
import { EnigmaScene } from './scene/EnigmaScene'
import { Tape } from './ui/Tape'

function App() {
  usePhysicalKeyboard()

  return (
    <main className="app">
      <EnigmaScene />
      <header className="title">
        <h1>Enigma I</h1>
        <p>Escribe con tu teclado o pulsa las teclas de la máquina. Arrastra para girarla.</p>
      </header>
      <Tape />
    </main>
  )
}

export default App
