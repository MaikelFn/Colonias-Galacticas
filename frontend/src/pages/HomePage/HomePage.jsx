import { useState, useEffect } from 'react'
import './HomePage.css'
import { useSocket } from '../../hooks/useSocket'
import CrearPartidaModal from '../Modals/CrearPartidaModal'
import VerPartidasModal from '../Modals/VerPartidasModal'
import RankingModal from '../Modals/RankingModal'

const STARS = Array.from({ length: 150 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 5,
  duration: Math.random() * 3 + 2.5,
  brightness: Math.random() * 0.7 + 0.3,
}))

function Star({ x, y, size, delay, duration, brightness }) {
  return (
    <div
      className="star"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        opacity: brightness,
      }}
    />
  )
}

// onEntrarLobby(partida, nombreJugador) — callback para navegar a sala de espera
function HomePage({ onEntrarLobby }) {
  const { emit, on, isConnected } = useSocket()

  const [usuario, setUsuario] = useState('')
  const [mounted, setMounted] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeModal, setActiveModal] = useState(null)

  const [nombrePartida, setNombrePartida] = useState('')
  const [galaxia, setGalaxia] = useState('orion')
  const [maxJugadores, setMaxJugadores] = useState(4)
  const [duracion, setDuracion] = useState(45)
  const [recursos, setRecursos] = useState('Normal')

  useEffect(() => { setMounted(true) }, [])

  // Registrar jugador cuando ingresa nombre
  useEffect(() => {
    if (usuario && isConnected) {
      emit('registrar_jugador', { nombre: usuario })
    }
  }, [usuario, isConnected, emit])

  // Escuchar partida creada → ir a lobby
  useEffect(() => {
    const unsub = on('partida_creada', (partida) => {
      setActiveModal(null)
      onEntrarLobby(partida, usuario)
    })
    return unsub
  }, [on, usuario, onEntrarLobby])

  // Escuchar errores de crear partida
  useEffect(() => {
    const unsub = on('error_crear_partida', (data) => {
      if (window.showAlert) {
        window.showAlert(data.mensaje)
      }
    })
    return unsub
  }, [on])

  // Escuchar errores de unirse a partida
  useEffect(() => {
    const unsub = on('error_unirse', (data) => {
      if (window.showAlert) {
        window.showAlert(data.mensaje)
      }
    })
    return unsub
  }, [on])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  const usuarioValido = usuario.trim().length > 0

  const handleSalir = () => setUsuario('')

  // Cuando el jugador selecciona una partida en VerPartidasModal → ir a lobby
  const handleUnirsePartida = (partida) => {
    setActiveModal(null)
    onEntrarLobby(partida, usuario)
  }

  const createButtonHandler = (btnName, callback) => ({
    onMouseEnter: () => setHoveredBtn(btnName),
    onMouseLeave: () => setHoveredBtn(null),
    onMouseMove: handleMouseMove,
    onClick: callback,
    style: {
      '--mouse-x': `${mousePos.x}%`,
      '--mouse-y': `${mousePos.y}%`,
    }
  })

  return (
    <div className={`gc-root ${mounted ? 'gc-mounted' : ''}`}>
      <div className="gc-starfield" aria-hidden="true">
        {STARS.map(s => <Star key={s.id} {...s} />)}
      </div>

      <div className="gc-nebula gc-nebula-1" aria-hidden="true" />
      <div className="gc-nebula gc-nebula-2" aria-hidden="true" />

      <main className="gc-main">
        <header className="gc-header">
          <div className="gc-orbit-ring" aria-hidden="true">
            <div className="gc-orbit-dot" />
          </div>
          <p className="gc-eyebrow">ESTRATEGIA GALÁCTICA MULTIJUGADOR</p>
          <h1 className="gc-title">
            <span className="gc-title-line1">GALACTIC</span>
            <span className="gc-title-line2">COLONIES</span>
          </h1>
          <p className="gc-subtitle">Conquista sistemas. Forja alianzas. Domina la galaxia.</p>
        </header>

        <section className="gc-card">
          <div className="gc-card-glow" aria-hidden="true" />

          <div className="gc-field-group">
            <label className="gc-label" htmlFor="gc-usuario">
              <span className="gc-label-dot" aria-hidden="true" />
              IDENTIFICADOR DE COMANDANTE (RF-01)
            </label>
            <div className="gc-input-wrap">
              <input
                id="gc-usuario"
                className="gc-input"
                type="text"
                placeholder="Ingresa tu nombre..."
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                maxLength={24}
                autoComplete="off"
                spellCheck={false}
              />
              {usuarioValido && (
                <span className="gc-input-check" aria-label="Usuario válido">OK</span>
              )}
            </div>
            {!usuarioValido && (
              <p className="gc-hint">Ingrese un nombre para continuar</p>
            )}
          </div>

          <div className="gc-actions">
            <button
              className={`gc-btn gc-btn-primary ${hoveredBtn === 'crear' ? 'hovered' : ''}`}
              disabled={!usuarioValido}
              {...createButtonHandler('crear', () => setActiveModal('crear'))}
            >
              CREAR PARTIDA
            </button>

            <button
              className={`gc-btn gc-btn-secondary ${hoveredBtn === 'ver' ? 'hovered' : ''}`}
              disabled={!usuarioValido}
              {...createButtonHandler('ver', () => setActiveModal('ver'))}
            >
              VER PARTIDAS
            </button>

            <div className="gc-actions-row2">
              <button
                className={`gc-btn gc-btn-ghost ${hoveredBtn === 'ranking' ? 'hovered' : ''}`}
                {...createButtonHandler('ranking', () => setActiveModal('ranking'))}
              >
                RANKING
              </button>

              <button
                className={`gc-btn gc-btn-danger ${hoveredBtn === 'salir' ? 'hovered' : ''}`}
                {...createButtonHandler('salir', handleSalir)}
              >
                SALIR
              </button>
            </div>
          </div>
        </section>

        <footer className="gc-footer">
          <span className="gc-footer-dot" aria-hidden="true" />
          <span>SECTOR CENTAURI - 32 SISTEMAS</span>
          <span className="gc-footer-sep" aria-hidden="true">·</span>
          <span>NEXO GALÁCTICO ACTIVO</span>
          <span className="gc-footer-dot" aria-hidden="true" />
        </footer>
      </main>

      {activeModal === 'crear' && (
        <CrearPartidaModal
          onClose={() => setActiveModal(null)}
          nombrePartida={nombrePartida}
          setNombrePartida={setNombrePartida}
          galaxia={galaxia}
          setGalaxia={setGalaxia}
          maxJugadores={maxJugadores}
          setMaxJugadores={setMaxJugadores}
          duracion={duracion}
          setDuracion={setDuracion}
          recursos={recursos}
          setRecursos={setRecursos}
          comandante={usuario}
        />
      )}

      {activeModal === 'ver' && (
        <VerPartidasModal
          onClose={() => setActiveModal(null)}
          comandante={usuario}
          onUnirse={handleUnirsePartida}
        />
      )}

      {activeModal === 'ranking' && (
        <RankingModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}

export default HomePage