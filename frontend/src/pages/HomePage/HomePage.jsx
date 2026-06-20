import { useState, useEffect, useRef, useCallback } from 'react'
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

const TOAST_ICONS = {
  info:    '///',
  exito:   '+++',
  peligro: '!!!',
  warn:    '---',
}

/**
 * Componente que muestra notificaciones tipo toast con estilo galáctico.
 * @param {Array} toasts - Array de objetos de notificación.
 * @returns {JSX.Element|null} El componente de toasts o null si no hay toasts.
 */
function ToastGalactico({ toasts }) {
  if (!toasts || toasts.length === 0) return null
  return (
    <div className="gp-toast-stack">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`gp-toast gp-toast-${t.tipo}`}
          style={{ '--gp-toast-duration': `${(t.duracion ?? 3500) / 1000}s` }}
        >
          <div className="gp-toast-header">
            <span className="gp-toast-icono">{TOAST_ICONS[t.tipo] ?? '◈'}</span>
            <span className="gp-toast-titulo">{t.titulo}</span>
          </div>
          {t.info && <span className="gp-toast-info">{t.info}</span>}
          <div className="gp-toast-barra" />
        </div>
      ))}
    </div>
  )
}

/**
 * Componente que renderiza una estrella individual con animación.
 * @param {number} x - Posición horizontal en porcentaje.
 * @param {number} y - Posición vertical en porcentaje.
 * @param {number} size - Tamaño de la estrella en píxeles.
 * @param {number} delay - Retraso de animación en segundos.
 * @param {number} duration - Duración de la animación en segundos.
 * @param {number} brightness - Opacidad de la estrella.
 * @returns {JSX.Element} El elemento div de la estrella.
 */
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

/**
 * Página principal del juego Colonias Galácticas.
 * Permite al usuario ingresar su nombre, crear partidas, ver partidas disponibles y ver el ranking.
 * 
 * @param {Function} onEntrarLobby - Callback para navegar al lobby cuando se une o crea una partida.
 * @param {Object} onEntrarLobby.partida - Datos de la partida.
 * @param {string} onEntrarLobby.nombreJugador - Nombre del jugador.
 * @returns {JSX.Element} La página principal.
 */
function HomePage({ onEntrarLobby }) {
  const { emit, on, isConnected } = useSocket({
    onError: (mensaje) => addToastRef.current('Error de conexión', mensaje, 'peligro')
  })

  const [usuario, setUsuario] = useState('')
  const [mounted, setMounted] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeModal, setActiveModal] = useState(null)
  const [toasts, setToasts] = useState([])

  /**
   * Agrega una notificación toast al sistema.
   * @param {string} titulo - Título de la notificación.
   * @param {string} info - Información adicional de la notificación.
   * @param {string} tipo - Tipo de notificación ('info', 'exito', 'peligro', 'warn').
   * @param {number} duracion - Duración en milisegundos antes de eliminar la notificación.
   */
  const addToast = useCallback((titulo, info, tipo = 'info', duracion = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, titulo, info, tipo, duracion }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duracion)
  }, [])
  const addToastRef = useRef(addToast)
  useEffect(() => { addToastRef.current = addToast }, [addToast])

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
      addToastRef.current('Error al crear partida', data.mensaje, 'peligro')
    })
    return unsub
  }, [on])

  /**
   * Maneja el movimiento del mouse para efectos visuales en los botones.
   * @param {MouseEvent} e - Evento del mouse.
   */
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  const usuarioValido = usuario.trim().length > 0

  /**
   * Limpia el nombre de usuario actual.
   */
  const handleSalir = () => setUsuario('')

  /**
   * Maneja la acción de unirse a una partida existente.
   * @param {Object} partida - Datos de la partida a unirse.
   */
  const handleUnirsePartida = (partida) => {
    setActiveModal(null)
    onEntrarLobby(partida, usuario)
  }

  /**
   * Crea un manejador de eventos para botones con efectos visuales.
   * @param {string} btnName - Nombre identificador del botón.
   * @param {Function} callback - Función a ejecutar al hacer click.
   * @returns {Object} Objeto con manejadores de eventos y estilos.
   */
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
          addToast={addToast}
        />
      )}

      {activeModal === 'ver' && (
        <VerPartidasModal
          onClose={() => setActiveModal(null)}
          comandante={usuario}
          onUnirse={handleUnirsePartida}
          addToast={addToast}
        />
      )}

      {activeModal === 'ranking' && (
        <RankingModal onClose={() => setActiveModal(null)} />
      )}

      <ToastGalactico toasts={toasts} />
    </div>
  )
}

export default HomePage