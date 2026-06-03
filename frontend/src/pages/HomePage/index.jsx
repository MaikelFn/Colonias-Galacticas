import { useState } from 'react'
import './index.css'

function HomePage() {
  const [usuario, setUsuario] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [accion, setAccion] = useState('')
  const [idSala, setIdSala] = useState('')

  const handleCrearPartida = () => {
    if (!usuario.trim()) return
    setAccion('crear')
    setMostrarModal(true)
  }

  const handleUnirsePartida = () => {
    if (!usuario.trim()) return
    setAccion('unirse')
    setMostrarModal(true)
  }

  const handleSalir = () => {
    setUsuario('')
  }

  const handleConectar = () => {
    console.log(`${accion} partida - Usuario: ${usuario}, Sala: ${idSala}`)
    setMostrarModal(false)
    setIdSala('')
  }

  const handleCancelar = () => {
    setMostrarModal(false)
    setIdSala('')
  }

  return (
    <div className="app">
      <h1>Galactic Colonies</h1>
      
      <div className="input-container">
        <input
          type="text"
          placeholder="Ingresa tu usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
      </div>

      <div className="buttons-container">
        <button 
          onClick={handleCrearPartida}
          disabled={!usuario.trim()}
          className={!usuario.trim() ? 'disabled' : ''}
        >
          Crear Partida
        </button>
        
        <button 
          onClick={handleUnirsePartida}
          disabled={!usuario.trim()}
          className={!usuario.trim() ? 'disabled' : ''}
        >
          Unirse a Partida
        </button>
        
        <button onClick={handleSalir}>
          Salir
        </button>
      </div>

      {mostrarModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{accion === 'crear' ? 'Crear Partida' : 'Unirse a Partida'}</h2>
            <input
              type="text"
              placeholder="ID de sala"
              value={idSala}
              onChange={(e) => setIdSala(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleConectar}>Conectar</button>
              <button onClick={handleCancelar} className="cancel">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
