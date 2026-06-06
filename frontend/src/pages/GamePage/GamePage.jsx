import MapaGalactico from '../MapaGalactico/MapaGalactico';
import StarfieldCanvas from '../../components/StarFieldCanvas/StarFieldCanvas'
import { useState, useEffect, useRef, useCallback } from 'react'
import socket from '../../services/socket'
import { getPlayerColor } from '../../utils/playerColors'
import './GamePage.css'

function Temporizador({ partidaIniciada }) {
  const [segsRestantes, setSegsRestantes] = useState(null)

  useEffect(() => {
    if (!partidaIniciada) { setSegsRestantes(null); return }

    function onTick(data) {
      setSegsRestantes(data.segsRestantes)
    }

    socket.on('tick_timer', onTick)
    return () => socket.off('tick_timer', onTick)
  }, [partidaIniciada])

  const formatTime = (secs) => {
    if (secs === null) return '--:--'
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const isRojo = segsRestantes !== null && segsRestantes <= 120

  return (
    <div className="gp-timer-floating">
      <span className={`gp-timer-display ${isRojo ? 'gp-timer-red' : ''}`}>
        {formatTime(segsRestantes)}
      </span>
    </div>
  )
}

function ModalConfirmarSalida({ onConfirmar, onCancelar }) {
  return (
    <div className="gp-modal-overlay">
      <div className="gp-modal">
        <div className="gp-modal-icon">⚠️</div>
        <h2 className="gp-modal-titulo">¿Abandonar la partida?</h2>
        <p className="gp-modal-texto">
          Serás retirado del campo de batalla. Tu progreso se perderá y no podrás regresar.
        </p>
        <div className="gp-modal-botones">
          <button className="gp-modal-btn gp-modal-cancelar" onClick={onCancelar}>
            No, continuar
          </button>
          <button className="gp-modal-btn gp-modal-confirmar" onClick={onConfirmar}>
            Sí, abandonar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de jugador con nuevo diseño ──────────────────────────────────────
function JugadoresPanel({ jugadores, miSocketId }) {
  if (!jugadores || jugadores.length === 0) {
    return <div className="gp-empty">Sin jugadores</div>
  }
  return (
    <div className="gp-jugadores-lista">
      {jugadores.map((j, i) => {
        const esYo = j.id === miSocketId
        const r = j.recursos
        const color = getPlayerColor(i)
        return (
          <div
            key={j.id || i}
            className={`gp-jugador-card ${esYo ? 'gp-jugador-yo' : ''}`}
            style={{ '--player-color': color }}
          >
            {/* Avatar grande centrado */}
            <div className="gp-jugador-nombre-row">
              <span className="gp-jugador-nombre-text">
                {j.nombre}
                {esYo && <span className="gp-jugador-tag"> (tú)</span>}
              </span>
            </div>
            <div className="gp-jugador-avatar-grande" style={{ background: color }}>
              {j.nombre.charAt(0).toUpperCase()}
            </div>
            {/* Recursos en fila */}
            <div className="gp-jugador-recursos-fila">
              <div className="gp-recurso-col">
                <span className="gp-recurso-label-small">Minerales</span>
                <span className="gp-recurso-valor-big">{r?.minerales ?? 0}</span>
              </div>
              <div className="gp-recurso-col">
                <span className="gp-recurso-label-small">Energía</span>
                <span className="gp-recurso-valor-big">{r?.energia ?? 0}</span>
              </div>
              <div className="gp-recurso-col">
                <span className="gp-recurso-label-small">Cristales</span>
                <span className="gp-recurso-valor-big">{r?.cristales ?? 0}</span>
              </div>
            </div>
            {/* Planetas conquistados */}
            <div className="gp-jugador-planetas-row">
              <span className="gp-planetas-label">Planetas</span>
              <span className="gp-planetas-count" style={{ color }}>{j.sistemasConquistados}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChatFrame({ nombreJugador, idPartida, mensajesSistema, jugadores }) {
  const [mensajes, setMensajes] = useState([])
  const bottomRef = useRef(null)
  const [texto, setTexto] = useState('')
  const idPartidaRef = useRef(idPartida)
  useEffect(() => { idPartidaRef.current = idPartida }, [idPartida])

  useEffect(() => {
      function onChatMensaje(data) {
        if (data.idPartida && data.idPartida !== idPartidaRef.current) return
        setMensajes(prev => {
          if (prev.some(m => m.idLocal === data.idLocal)) return prev
          return [...prev, data]
        })
      }
      socket.on('chat_mensaje', onChatMensaje)
      return () => socket.off('chat_mensaje', onChatMensaje)
    }, [])

    useEffect(() => {
        if (!mensajesSistema || mensajesSistema.length === 0) return
        const ultimo = mensajesSistema[mensajesSistema.length - 1]
        setMensajes(prev => {
          if (prev.some(m => m.ts === ultimo.ts)) return prev
          return [...prev, ultimo]
        })
      }, [mensajesSistema])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = () => {
      const msg = texto.trim()
      if (!msg) return
      const mensajePropio = {
        nombreJugador,
        mensaje: msg,
        idLocal: Date.now(),
        ts: Date.now()
      }
      setMensajes(prev => [...prev, mensajePropio])
      socket.emit('chat_mensaje', {
        idPartida: idPartidaRef.current,
        nombreJugador,
        mensaje: msg,
        idLocal: mensajePropio.idLocal
      })
      setTexto('')
    }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  return (
      <div className="gp-chat-body">
        <div className="gp-chat-mensajes">
          {mensajes.length === 0 && (
            <p className="gp-chat-vacio">El chat está vacío. ¡Di algo, comandante!</p>
          )}

          {mensajes.map((m, i) => {
            const esSistema = m.nombreJugador === 'Sistema';
            const esMio = !esSistema && m.nombreJugador === nombreJugador;
            
            const jugadorIndex = jugadores ? jugadores.findIndex(j => j.nombre === m.nombreJugador) : -1;
            const colorJugador = jugadorIndex !== -1 ? getPlayerColor(jugadorIndex) : '#ffffff';

            return (
              <div key={i} className={`gp-chat-msg ${esMio ? 'gp-chat-self' : ''} ${esSistema ? 'gp-chat-sistema' : ''}`}
                style={esMio ? { opacity: 1 } : {}}
              >
                {esSistema ? (
                  <span className="gp-chat-texto">🔔 {m.mensaje}</span>
                ) : (
                  <>
                    <span 
                      className="gp-chat-autor" 
                      style={{ 
                        color: colorJugador,
                        opacity: 1
                      }}
                    >
                      {m.nombreJugador}
                    </span>
                    <span className="gp-chat-separador">:</span>
                    <span className="gp-chat-texto">{m.mensaje}</span>
                  </>
                )}
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
        <div className="gp-chat-input-row">
          <input
            className="gp-chat-input"
            type="text"
            placeholder="Mensaje..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKey}
            maxLength={200}
            autoComplete="off"
          />
          <button className="gp-chat-send" onClick={enviar} disabled={!texto.trim()}>➤</button>
        </div>
      </div>
    )
}

// ─── AccionesPanel ────────────────────────────────────────────────────────────
// RF-17 / RF-19: Enviar flotas a sistema adyacente (conquista o ataque según propietario)
// RF-15: Construir Mina, Central de Investigación, Astillero, Fortaleza
// RF-16: Astillero produce flotas (acción de construcción)
const ACCIONES = [
  {
    id: 'ENVIAR_FLOTAS',
    label: 'Enviar Flotas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L8 9H3l4.5 4-1.5 7L12 17l6 3-1.5-7L21 9h-5L12 2z" />
      </svg>
    ),
    color: '#f87171',   // rojo — acción ofensiva/militar
  },
  {
    id: 'CONSTR_MINA',
    label: 'Construir Mina',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" />
        <path d="M6 20V10l6-8 6 8v10" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
    color: '#fb923c',   // naranja — extracción de recursos
  },
  {
    id: 'CONSTR_CENTRAL',
    label: 'Central Inv.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    color: '#38bdf8',   // azul cian — ciencia
  },
  {
    id: 'CONSTR_ASTILLERO',
    label: 'Astillero',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 5 5 3-4 4 7H3z" />
        <path d="M3 21h18" />
      </svg>
    ),
    color: '#a78bfa',   // violeta — producción militar
  },
  {
    id: 'CONSTR_FORTALEZA',
    label: 'Fortaleza',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="1" />
        <path d="M3 11V7h3V4h3v3h6V4h3v3h3v4" />
      </svg>
    ),
    color: '#fbbf24',   // ámbar — defensa
  },
  {
    id: 'MOVER_FLOTAS',
    label: 'Mover Flotas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
      </svg>
    ),
    color: '#4ade80',   // verde — movilización
  },
]

function AccionesPanel({ partidaIniciada, sistemaSeleccionado, nombreJugador }) {
  
  const obtenerDeshabilitado = (accionId) => {
    // Si la partida no ha empezado, todo está deshabilitado (RF-07/RF-13)
    if (!partidaIniciada) return true;
    // Si no hay un planeta seleccionado, no se puede operar sobre nada
    if (!sistemaSeleccionado) return true;

    const esPropietario = sistemaSeleccionado.propietario === nombreJugador;
    const tienePropietario = !!sistemaSeleccionado.propietario;

    switch (accionId) {
      case 'CONSTR_MINA':
      case 'CONSTR_CENTRAL':
      case 'CONSTR_ASTILLERO':
      case 'CONSTR_FORTALEZA':
        // RF-15: Solo puedes construir instalaciones dentro de sistemas que controles
        return !esPropietario;

      case 'ENVIAR_FLOTAS':
        // RF-18 / RF-19: Envías flotas a atacar o conquistar un sistema ajeno o libre
        return esPropietario;

      case 'MOVER_FLOTAS':
        // RF-17: Movilizas flotas desde un sistema que tú controlas
        return !esPropietario;

      default:
        return true;
    }
  };

  return (
    <section className="gp-frame gp-frame-acciones">
      <div className="gp-acciones-grid">
        {ACCIONES.map((accion) => {
          const isDisabled = obtenerDeshabilitado(accion.id);
          return (
            <button
              key={accion.id}
              className={`gp-accion-btn ${isDisabled ? 'gp-accion-disabled' : ''}`}
              style={{ '--accion-color': accion.color }}
              disabled={isDisabled}
              onClick={() => console.log(`Ejecutando ${accion.id} en ${sistemaSeleccionado?.nombre}`)}
            >
              <span className="gp-accion-icon">{accion.icon}</span>
              <span className="gp-accion-label">{accion.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── MapaArea ─────────────────────────────────────────────────────────────────
function MapaArea({ estadoPartida, jugadores, onSistemaClick }) {
  const galaxia = estadoPartida?.galaxia

  if (!galaxia || typeof galaxia === 'string' || !galaxia.sistemas) {
    return <div className="gp-empty">Cargando sistemas estelares...</div>
  }

  return (
    <MapaGalactico
      sistemas={galaxia.sistemas}
      rutas={galaxia.rutas}
      jugadores={jugadores}
      onSistemaClick={onSistemaClick}
    />
  )
}

// ─── GamePage ─────────────────────────────────────────────────────────────────
export default function GamePage({ partida, nombreJugador, onSalir }) {
  const [partidaActual]               = useState(partida)
  const [miSocketId, setMiSocketId]   = useState(null)
  const [partidaIniciada, setPartidaIniciada] = useState(partida?.estado === 'iniciada')
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false)
  const [mensajesSistema, setMensajesSistema] = useState([])
  const [estadoPartida, setEstadoPartida] = useState(partida)
  const [jugadores, setJugadores] = useState(partida?.jugadores || [])
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);

  const idPartidaRef = useRef(partida?.id)

  useEffect(() => {
    const yo = jugadores.find(j => j.nombre === nombreJugador)
    if (yo?.id) setMiSocketId(yo.id)
  }, [jugadores, nombreJugador])

  useEffect(() => {
    const handleIniciada = (data) => {
      setEstadoPartida(prev => ({ ...prev, ...data, galaxia: data.galaxia }))
      if (data.jugadores) setJugadores(data.jugadores)
      setPartidaIniciada(true)
    }
    socket.on('partida_iniciada', handleIniciada)
    return () => socket.off('partida_iniciada', handleIniciada)
  }, [])

  useEffect(() => {
    function onJugadorUnido(data) {
      if (data.idPartida !== idPartidaRef.current) return
      setJugadores(prev => {
        if (prev.find(j => j.id === data.jugador.id)) return prev
        return [...prev, { ...data.jugador }]
      })
    }

    function onJugadorSalio(data) {
      if (data.idPartida !== idPartidaRef.current) return
      setJugadores(prev => {
        const saliente = prev.find(j => j.id === data.jugadorId)
        const nombre = saliente ? saliente.nombre : 'Un comandante'
        setMensajesSistema(ms => [...ms, {
          nombreJugador: 'Sistema',
          mensaje: `${nombre} ha abandonado la partida.`,
          ts: Date.now(),
        }])
        return prev.filter(j => j.id !== data.jugadorId)
      })
    }

    function onActualizarClientes(data) {
      if (data.idPartida && data.idPartida !== idPartidaRef.current) return
      if (data.jugadores) setJugadores(data.jugadores)
      if (data.galaxia) {
        setEstadoPartida(prev => ({ ...prev, galaxia: data.galaxia }))
      }
    }

    function onEstadoJugadores(data) {
      if (data.idPartida && data.idPartida !== idPartidaRef.current) return
      const lista = Array.isArray(data) ? data : data.jugadores
      if (!Array.isArray(lista)) return
      setJugadores(lista)
    }

    function onPlanetaConquistado(data) {
      if (data.idPartida && data.idPartida !== idPartidaRef.current) return
      const ganadorId = data.conquistadorId
      const perdedorId = data.anteriorDuenoId
      setJugadores(prev =>
        prev.map(j => {
          if (j.id === ganadorId)
            return { ...j, sistemasConquistados: j.sistemasConquistados + 1 }
          if (perdedorId && j.id === perdedorId)
            return { ...j, sistemasConquistados: Math.max(0, j.sistemasConquistados - 1) }
          return j
        })
      )
    }

    socket.on('jugador_unido',       onJugadorUnido)
    socket.on('jugador_salio',       onJugadorSalio)
    socket.on('actualizar_clientes', onActualizarClientes)
    socket.on('estado_jugadores',    onEstadoJugadores)
    socket.on('planeta_conquistado', onPlanetaConquistado)

    return () => {
      socket.off('jugador_unido',       onJugadorUnido)
      socket.off('jugador_salio',       onJugadorSalio)
      socket.off('actualizar_clientes', onActualizarClientes)
      socket.off('estado_jugadores',    onEstadoJugadores)
      socket.off('planeta_conquistado', onPlanetaConquistado)
    }
  }, [])

  const handleConfirmarSalida = useCallback(() => {
    socket.emit('abandonar_partida', {
      idPartida: idPartidaRef.current,
      jugadorId: miSocketId
    })
    setMostrarModalSalida(false)
    onSalir()
  }, [onSalir, miSocketId])

  const duracionMin = partidaActual.duracion

  return (
    <div className="gp-root">
      <StarfieldCanvas />

      {mostrarModalSalida && (
        <ModalConfirmarSalida
          onConfirmar={handleConfirmarSalida}
          onCancelar={() => setMostrarModalSalida(false)}
        />
      )}

      {/* Temporizador flotante centrado, sin header */}
      <Temporizador partidaIniciada={partidaIniciada} />

      <div className="gp-layout">

        {/* Columna izquierda: jugadores + botón salir */}
        <aside className="gp-sidebar">
          <div className="gp-frame gp-frame-jugadores">
            <JugadoresPanel jugadores={jugadores} miSocketId={miSocketId} />
          </div>
          <div className="gp-sidebar-footer">
            <span className="gp-comandante-label">⚑ {nombreJugador}</span>
            <button className="gp-salir-btn" onClick={() => setMostrarModalSalida(true)}>
              ← SALIR
            </button>
          </div>
        </aside>

        {/* Centro: mapa */}
        <section className="gp-frame gp-frame-mapa">
          <div className="gp-frame-body gp-frame-body-mapa">
            <MapaArea
              estadoPartida={estadoPartida}
              jugadores={jugadores}
              onSistemaClick={(sis) => {
                console.log('Sistema seleccionado:', sis);
                setSistemaSeleccionado(sis);
              }}
            />
          </div>
        </section>

        {/* Derecha: acciones + chat */}
        <div className="gp-right-col">
          <AccionesPanel 
            partidaIniciada={partidaIniciada} 
            sistemaSeleccionado={sistemaSeleccionado}
            nombreJugador={nombreJugador}
          />

          <section className="gp-frame gp-frame-chat">
          <ChatFrame
            nombreJugador={nombreJugador}
            idPartida={partidaActual?.id}
            mensajesSistema={mensajesSistema}
            jugadores={jugadores}
          />
        </section>
        </div>

      </div>
    </div>
  )
}