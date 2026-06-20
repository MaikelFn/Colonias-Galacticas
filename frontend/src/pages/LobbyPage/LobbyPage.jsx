import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '../../hooks/useSocket'
import { getPlayerColor } from '../../utils/playerColors'
import './LobbyPage.css'

const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 6,
  duration: Math.random() * 4 + 3,
}))

/**
 * Componente que renderiza una estrella individual con animación.
 * @param {number} x - Posición horizontal en porcentaje.
 * @param {number} y - Posición vertical en porcentaje.
 * @param {number} size - Tamaño de la estrella en píxeles.
 * @param {number} delay - Retraso de animación en segundos.
 * @param {number} duration - Duración de la animación en segundos.
 * @returns {JSX.Element} El elemento div de la estrella.
 */
function Star({ x, y, size, delay, duration }) {
  return (
    <div
      className="lb-star"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  )
}

/**
 * Componente que muestra un slot de jugador en la sala de espera.
 * @param {Object|null} jugador - Datos del jugador o null si el slot está vacío.
 * @param {number} index - Índice del jugador en la lista (determina el color).
 * @param {boolean} isCreador - Indica si es el creador de la partida.
 * @param {boolean} esYo - Indica si es el usuario actual.
 * @returns {JSX.Element} El componente del slot de jugador.
 */
function PlayerSlot({ jugador, index, isCreador, esYo }) {
  const color = jugador ? getPlayerColor(index) : null

  return (
    <div
      className={`lb-player-slot ${jugador ? 'lb-slot-filled' : 'lb-slot-empty'} ${esYo ? 'lb-slot-yo' : ''}`}
      style={color ? { '--player-color': color, borderLeftColor: color } : undefined}
    >
      <div className="lb-slot-index">P{index + 1}</div>
      {jugador ? (
        <>
          <div className="lb-slot-avatar" style={{ background: color }}>
            {jugador.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="lb-slot-info">
            <span className="lb-slot-name">
              {jugador.nombre}
              {esYo && <span className="lb-slot-tag" style={{ color }}> (tú)</span>}
            </span>
            {isCreador && <span className="lb-slot-badge">⭐ ANFITRIÓN</span>}
          </div>
          <div className="lb-slot-status lb-status-ready" style={{ color }}>LISTO</div>
        </>
      ) : (
        <>
          <div className="lb-slot-avatar lb-avatar-empty">?</div>
          <div className="lb-slot-info">
            <span className="lb-slot-name lb-name-empty">Esperando jugador...</span>
          </div>
          <div className="lb-slot-status lb-status-waiting">—</div>
        </>
      )}
    </div>
  )
}

/**
 * Componente que muestra la cuenta regresiva antes de iniciar la partida.
 * @param {number} cuenta - Número actual de la cuenta regresiva.
 * @returns {JSX.Element} El overlay de cuenta regresiva.
 */
function CountdownOverlay({ cuenta }) {
  const esAlertaCritica = cuenta === 1;

  return (
    <div className={`lb-countdown-overlay ${esAlertaCritica ? 'lb-neon-alert' : ''}`}>
      <div className="lb-scanlines" />
      
      <div className="lb-countdown-container">
        <span className="lb-countdown-title">INICIO DE SECUENCIA DE SALTO</span>
        
        <div key={cuenta} className="lb-countdown-number-wrapper">
          <span className="lb-countdown-number">{cuenta}</span>
        </div>

        <span className="lb-countdown-subtitle">PREPARANDO MOTORES DE CURVATURA...</span>
      </div>
    </div>
  );
}

/**
 * Componente que muestra un overlay cuando la partida está cerrada.
 * @param {string} razon - Razón por la que la partida está cerrada.
 * @returns {JSX.Element} El overlay de partida cerrada.
 */
function ClosedOverlay({ razon }) {
  return (
    <div className="lb-countdown-overlay lb-closed-overlay">
      <div className="lb-countdown-content">
        <div className="lb-closed-icon">✕</div>
        <p className="lb-countdown-label">PARTIDA CERRADA</p>
        <p className="lb-countdown-sub">{razon}</p>
      </div>
    </div>
  )
}

/**
 * Página de sala de espera (lobby) del juego Colonias Galácticas.
 * Muestra los jugadores conectados, configuración de la partida y chat.
 * 
 * @param {Object} partida - Datos de la partida.
 * @param {string} nombreJugador - Nombre del jugador actual.
 * @param {Function} onIniciarJuego - Callback para iniciar el juego.
 * @param {Function} onSalir - Callback para salir del lobby.
 * @returns {JSX.Element} La página del lobby.
 */
export default function LobbyPage({ partida, nombreJugador, onIniciarJuego, onSalir }) {
  const { emit, on } = useSocket()

  const [partidaActual, setPartidaActual] = useState(partida)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cuentaRegresiva, setCuentaRegresiva] = useState(null)
  const [partidaCerrada, setPartidaCerrada] = useState(null)
  const [tiempoEspera, setTiempoEspera] = useState(null)
  const [lleno, setLleno] = useState(false)
  const [mounted, setMounted] = useState(false)
  const onIniciarJuegoRef = useRef(onIniciarJuego)
  const partidaActualRef  = useRef(partidaActual)
  const chatBottomRef = useRef(null)

  const esCreador = partidaActual?.creador === undefined
      ? partidaActual?.jugadores?.[0]?.nombre === nombreJugador
      : partidaActual?.creador === nombreJugador

  const jugadoresActuales = partidaActual.jugadores
  const maxJugadores = partidaActual.maxJugadores
  const minJugadores = partidaActual.minJugadores || 2
  const slotsVacios = Array.from({ length: Math.max(0, maxJugadores - jugadoresActuales.length) })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const puedeIniciar = jugadoresActuales.length >= minJugadores
    setLleno(puedeIniciar)
  }, [jugadoresActuales.length, minJugadores])

  useEffect(() => {
    const unsub = on('jugador_unido', (data) => {
      setPartidaActual(prev => {
        if (prev.jugadores.some(j => j.id === data.jugador.id)) return prev
        return { ...prev, jugadores: [...prev.jugadores, data.jugador] }
      })
      setMensajes(prev => [...prev, {
        nombreJugador: 'Sistema',
        mensaje: `${data.jugador.nombre} se ha unido a la sala.`,
        isSystem: true
      }])
    })
    return unsub
  }, [on])

  useEffect(() => {
    const unsub = on('jugador_salio', (data) => {
      setPartidaActual(prev => ({
        ...prev,
        jugadores: prev.jugadores.filter(j => j.id !== data.jugadorId)
      }))
      setMensajes(prev => [...prev, {
        nombreJugador: 'Sistema',
        mensaje: 'Un comandante ha abandonado la sala.',
        isSystem: true
      }])
    })
    return unsub
  }, [on])

  useEffect(() => {
    const unsub = on('cuenta_regresiva', (data) => {
      if (data.idPartida === partidaActual?.id) {
        setCuentaRegresiva(data.cuenta)
        if (data.cuenta === 0) {
          setTimeout(() => onIniciarJuego(partidaActual), 500)
        }
      }
    })
    return unsub
  }, [on, partidaActual?.id, onIniciarJuego, partidaActual])

  useEffect(() => {
    const unsub = on('partida_cerrada', (data) => {
      if (data.idPartida === partidaActual?.id) {
        setPartidaCerrada(data.razon)
        setTimeout(() => onSalir(), 2000)
      }
    })
    return unsub
  }, [on, partidaActual?.id, onSalir])

  useEffect(() => {
    const unsub = on('temporizador_espera', (data) => {
      if (data.idPartida === partidaActual?.id) {
        setTiempoEspera(data.segundosRestantes)
      }
    })
    return unsub
  }, [on, partidaActual?.id])

  useEffect(() => {
    const unsub = on('chat_mensaje', (data) => {
      setMensajes(prev => {
        const existe = prev.some(m => m.idLocal === data.idLocal)
        if (existe) return prev
        return [...prev, data]
      })
    })
    return unsub
  }, [on, partidaActual?.id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'u' || e.key === 'U') {
        if (esCreador && lleno && cuentaRegresiva === null && !partidaCerrada) {
          handleIniciarPartida();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [esCreador, lleno, cuentaRegresiva, partidaCerrada]);

  useEffect(() => {
    const unsub = on('partida_iniciada', (data) => {
      console.log('[LobbyPage] partida_iniciada recibida:', data)
      const partida = partidaActualRef.current

      const idRecibido = data.idPartida
      if (idRecibido && idRecibido !== partida?.id) {
        console.warn('ID no coincide:', idRecibido, partida?.id)
        return
      }

      const partidaActualizada = {
        ...partida,
        estado: data.estado,
        galaxia: data.galaxia,           // ← incluye la galaxia completa
        jugadores: data.jugadores.map(j => ({
          id: j.id,
          nombre: j.nombre,
          recursos: j.recursos,
          sistemasConquistados: j.sistemasConquistados,
          planetaBase: j.planetaBase,
        })),
      }

      onIniciarJuegoRef.current(partidaActualizada)
    })
    return unsub
  }, [on])

  // Escuchar errores de inicio de partida
  useEffect(() => {
    const unsub = on('error_inicio', (data) => {
      if (window.showAlert) {
        window.showAlert(data.mensaje)
      }
    })
    return unsub
  }, [on])

  useEffect(() => { onIniciarJuegoRef.current = onIniciarJuego }, [onIniciarJuego])
  useEffect(() => { partidaActualRef.current  = partidaActual  }, [partidaActual])

  /**
   * Solicita al servidor iniciar la partida.
   */
  const handleIniciarPartida = useCallback(() => {
    emit('iniciar_partida', { idPartida: partidaActual?.id })
  }, [emit, partidaActual?.id])

  /**
   * Sale de la sala de espera y vuelve al menú principal.
   */
  const handleSalirDeLobby = () => {
    emit('salir_sala', { idPartida: partidaActual?.id })
    onSalir()
  }

  /**
   * Envía un mensaje al chat del lobby.
   */
  const enviarMensaje = () => {
    const msg = texto.trim()
    if (!msg) return

    const msgObj = {
      nombreJugador,
      mensaje: msg,
      ts: Date.now(),
      idLocal: Math.random().toString(36).substr(2, 9)
    }

    setMensajes(prev => [...prev, msgObj])
    emit('chat_mensaje', {
      idPartida: partidaActual?.id,
      nombreJugador,
      mensaje: msg,
      idLocal: msgObj.idLocal
    })
    setTexto('')
  }

  /**
   * Maneja la tecla Enter para enviar mensajes en el chat.
   * @param {KeyboardEvent} e - Evento de teclado.
   */
  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  const recursosLabel = {
    Bajo: '🔵 100m · 50e · 20c',
    Normal: '🟡 300m · 150e · 50c',
    Alto: '🔴 500m · 250e · 100c',
  }

  return (
    <div className={`lb-root ${mounted ? 'lb-mounted' : ''}`}>
      <div className="lb-starfield" aria-hidden="true">
        {STARS.map(s => <Star key={s.id} {...s} />)}
      </div>
      <div className="lb-nebula lb-nebula-1" aria-hidden="true" />
      <div className="lb-nebula lb-nebula-2" aria-hidden="true" />

      <header className="lb-header">
        <div className="lb-header-left">
          <span className="lb-logo">⬡ COLONIAS GALÁCTICAS</span>
          <span className="lb-divider">·</span>
          <span className="lb-room-name">{partidaActual?.nombre}</span>
        </div>
        <div className="lb-header-right">
          {tiempoEspera !== null && !lleno && (
            <span className="lb-timer-warning">
              ⏱ Cierre en {tiempoEspera}s
            </span>
          )}
          <span className="lb-comandante">⚑ {nombreJugador}</span>
          <button className="lb-salir-btn" onClick={handleSalirDeLobby}>← SALIR</button>
        </div>
      </header>

      <div className="lb-main">

        <div className="lb-panel-left">

          <section className="lb-card lb-card-info">
            <h3 className="lb-card-title">
              <span className="lb-card-icon">⚙</span>
              CONFIGURACIÓN DE PARTIDA
            </h3>
            <div className="lb-info-grid">
              <div className="lb-info-row">
                <span className="lb-info-key">Galaxia</span>
                <span className="lb-info-val">{partidaActual?.galaxia}</span>
              </div>
              <div className="lb-info-row">
                <span className="lb-info-key">Duración</span>
                <span className="lb-info-val">{partidaActual?.duracion} min</span>
              </div>
              <div className="lb-info-row">
                <span className="lb-info-key">Recursos</span>
                <span className="lb-info-val">{recursosLabel[partidaActual.recursos]}</span>
              </div>
              <div className="lb-info-row">
                <span className="lb-info-key">ID Partida</span>
                <span className="lb-info-val lb-info-id">{partidaActual?.id?.slice(-8)}</span>
              </div>
            </div>
          </section>

          <section className="lb-card lb-card-players">
            <h3 className="lb-card-title">
              <span className="lb-card-icon">👥</span>
              SALA DE ESPERA
              <span className="lb-players-count">
                {jugadoresActuales.length} / {maxJugadores}
              </span>
            </h3>

            <div className="lb-progress-bar">
              <div
                className="lb-progress-fill"
                style={{ width: `${(jugadoresActuales.length / maxJugadores) * 100}%` }}
              />
            </div>

            <div className="lb-players-list">
              {jugadoresActuales.map((j, i) => (
                <PlayerSlot
                  key={j.id || i}
                  jugador={j}
                  index={i}
                  isCreador={i === 0}
                  esYo={j.nombre === nombreJugador}
                />
              ))}
              {slotsVacios.map((_, i) => (
                <PlayerSlot
                  key={`empty-${i}`}
                  jugador={null}
                  index={jugadoresActuales.length + i}
                  isCreador={false}
                  esYo={false}
                />
              ))}
            </div>
          </section>

          <div className="lb-start-section">
            {lleno ? (
              <button
                className="lb-start-btn lb-start-ready"
                onClick={handleIniciarPartida}
                disabled={cuentaRegresiva !== null || !esCreador}
              >
                <span className="lb-start-icon">▶</span>
                {esCreador ? 'INICIAR PARTIDA' : 'ESPERANDO AL ANFITRIÓN'} 
                {esCreador && <span className="lb-start-hint">(o presiona U)</span>}
              </button>
            ) : (
              <div className="lb-start-waiting">
                <div className="lb-waiting-dots">
                  <span /><span /><span />
                </div>
                <span>Esperando {Math.max(0, minJugadores - jugadoresActuales.length)} jugador(es) más para iniciar...</span>
              </div>
            )}
          </div>
        </div>

        <div className="lb-panel-right">
          <section className="lb-card lb-card-chat">
            <h3 className="lb-card-title">
              <span className="lb-card-icon">💬</span>
              COMUNICACIONES
            </h3>
            <div className="lb-chat-messages">
              {mensajes.length === 0 && (
                <p className="lb-chat-empty">Canal abierto. ¡Di algo, comandante!</p>
              )}
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={`lb-chat-msg ${m.nombreJugador === nombreJugador ? 'lb-msg-self' : ''}`}
                >
                  <span className="lb-msg-autor">{m.nombreJugador}</span>
                  <span className="lb-msg-sep">›</span>
                  <span className="lb-msg-texto">{m.mensaje}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="lb-chat-input-row">
              <input
                className="lb-chat-input"
                type="text"
                placeholder="Mensaje..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={handleChatKey}
                maxLength={200}
                autoComplete="off"
              />
              <button
                className="lb-chat-send"
                onClick={enviarMensaje}
                disabled={!texto.trim()}
              >
                ➤
              </button>
            </div>
          </section>
        </div>
      </div>

      {cuentaRegresiva !== null && (
            <CountdownOverlay cuenta={cuentaRegresiva} />
      )}

      {partidaCerrada && (
        <ClosedOverlay razon={partidaCerrada} />
      )}
    </div>
  )
}