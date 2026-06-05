import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '../../hooks/useSocket'
import './index.css'

const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 6,
  duration: Math.random() * 4 + 3,
}))

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

function PlayerSlot({ jugador, index, isCreador, esYo }) {
  return (
    <div className={`lb-player-slot ${jugador ? 'lb-slot-filled' : 'lb-slot-empty'} ${esYo ? 'lb-slot-yo' : ''}`}>
      <div className="lb-slot-index">P{index + 1}</div>
      {jugador ? (
        <>
          <div className="lb-slot-avatar">
            {jugador.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="lb-slot-info">
            <span className="lb-slot-name">
              {jugador.nombre}
              {esYo && <span className="lb-slot-tag"> (tú)</span>}
            </span>
            {isCreador && <span className="lb-slot-badge">⭐ ANFITRIÓN</span>}
          </div>
          <div className="lb-slot-status lb-status-ready">LISTO</div>
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

function CountdownOverlay({ cuenta }) {
  return (
    <div className="lb-countdown-overlay">
      <div className="lb-countdown-ring" />
      <div className="lb-countdown-content">
        <p className="lb-countdown-label">INICIANDO EN</p>
        <div className="lb-countdown-number">{cuenta}</div>
        <p className="lb-countdown-sub">¡Prepárate, comandante!</p>
      </div>
    </div>
  )
}

function ClosedOverlay({ razon }) {
  return (
    <div className="lb-countdown-overlay lb-closed-overlay">
      <div className="lb-countdown-content">
        <div className="lb-closed-icon">✕</div>
        <p className="lb-countdown-label">PARTIDA CERRADA</p>
        <p className="lb-countdown-sub">{razon || 'La partida fue cerrada por inactividad.'}</p>
      </div>
    </div>
  )
}

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
    : true

  const jugadoresActuales = partidaActual?.jugadores || []
  const maxJugadores = partidaActual?.maxJugadores || 4
  const slotsVacios = Array.from({ length: Math.max(0, maxJugadores - jugadoresActuales.length) })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const estaLleno = jugadoresActuales.length >= maxJugadores
    setLleno(estaLleno)
  }, [jugadoresActuales.length, maxJugadores])

  useEffect(() => {
    const unsub = on('jugador_unido', (data) => {
      if (data.idPartida === partidaActual?.id) {
        setPartidaActual(prev => {
          const yaEsta = prev.jugadores.some(j => j.id === data.jugador.id)
          if (yaEsta) return prev
          return {
            ...prev,
            jugadores: [...prev.jugadores, data.jugador]
          }
        })
      }
    })
    return unsub
  }, [on, partidaActual?.id])

  useEffect(() => {
    const unsub = on('jugador_salio', (data) => {
      if (data.idPartida === partidaActual?.id) {
        setPartidaActual(prev => ({
          ...prev,
          jugadores: prev.jugadores.filter(j => j.id !== data.jugadorId)
        }))
      }
    })
    return unsub
  }, [on, partidaActual?.id])

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
        console.log('Partida cerrada:', data.razon)
        setPartidaCerrada(data.razon || 'Tiempo de espera agotado.')
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
      if (data.idPartida === partidaActual?.id) {
        setMensajes(prev => [...prev, data]);
      }
    });
    return unsub;
  }, [on, partidaActual?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'u' || e.key === 'U') {
        if (lleno && cuentaRegresiva === null && !partidaCerrada) {
          handleIniciarPartida()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lleno, cuentaRegresiva, partidaCerrada])

  useEffect(() => {
    const unsub = on('partida_iniciada', (data) => {
      console.log('[LobbyPage] partida_iniciada recibida:', data)
      const partida = partidaActualRef.current

      const idRecibido = data.idPartida ?? data.id
      if (idRecibido && idRecibido !== partida?.id) {
        console.warn('ID no coincide:', idRecibido, partida?.id)
        return
      }

      const partidaActualizada = {
        ...partida,
        estado: data.estado,
        jugadores: (data.jugadores ?? []).map(j => ({
          id: j.id,
          nombre: j.nombre,
          recursos: j.recursos,
          planetasConquistados: 0,
          planetaBase: j.planetaBase,
        })),
      }

      onIniciarJuegoRef.current(partidaActualizada)
    })
    return unsub
  }, [on])

  useEffect(() => { onIniciarJuegoRef.current = onIniciarJuego }, [onIniciarJuego])

  useEffect(() => { partidaActualRef.current  = partidaActual  }, [partidaActual])

  const handleIniciarPartida = useCallback(() => {
    emit('iniciar_partida', { idPartida: partidaActual?.id })
  }, [emit, partidaActual?.id])

  const handleSalirDeLobby = () => {
    emit('salir_sala', { idPartida: partidaActual?.id, nombreJugador })
    onSalir()
  }

  const enviarMensaje = () => {
    const msg = texto.trim()
    if (!msg) return

    const msgObj = { nombreJugador, mensaje: msg, ts: Date.now() }
    
    setMensajes(prev => [...prev, msgObj])

    emit('chat_mensaje', {
      idPartida: partidaActual?.id,
      nombreJugador,
      mensaje: msg
    })
    setTexto('')
  }

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
                <span className="lb-info-val">{recursosLabel[partidaActual?.recursos] || partidaActual?.recursos}</span>
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
                disabled={cuentaRegresiva !== null}
              >
                <span className="lb-start-icon">▶</span>
                INICIAR PARTIDA
                <span className="lb-start-hint">(o presiona U)</span>
              </button>
            ) : (
              <div className="lb-start-waiting">
                <div className="lb-waiting-dots">
                  <span /><span /><span />
                </div>
                <span>Esperando {maxJugadores - jugadoresActuales.length} jugador(es) más...</span>
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