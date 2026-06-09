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

  const formatTime = (segundos) => {
    if (segundos === null) return '--:--'
    const minutos = Math.floor(segundos / 60).toString().padStart(2, '0')
    const segundosStr = (segundos % 60).toString().padStart(2, '0')
    return `${minutos}:${segundosStr}`
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

// ─── NUEVO: Modal Flotante de Jugadores (Reutiliza el diseño de tarjetas) ─────
function ModalVerJugadores({ jugadores, miSocketId, onCerrar }) {
  return (
    <div className="gp-modal-overlay">
      <div className="gp-modal gp-modal-jugadores-flotante">
        <div className="gp-modal-header-jugadores">
          <h2 className="gp-modal-titulo">ESTADO DE LA GALAXIA</h2>
          <p className="gp-modal-texto">Comandantes en el sector</p>
        </div>

        <div className="gp-jugadores-lista-scroll">
          {!jugadores || jugadores.length === 0 ? (
            <div className="gp-empty">Sin jugadores</div>
          ) : (
            <div className="gp-jugadores-lista">
              {jugadores.map((jugador, indice) => {
                const esYo = jugador.id === miSocketId
                const recursosJugador = jugador.recursos
                const color = getPlayerColor(indice)
                return (
                  <div
                    key={jugador.id || indice}
                    className={`gp-jugador-card ${esYo ? 'gp-jugador-yo' : ''}`}
                    style={{ '--player-color': color }}
                  >
                    <div className="gp-jugador-nombre-row">
                      <span className="gp-jugador-nombre-text">
                        {jugador.nombre}
                        {esYo && <span className="gp-jugador-tag"> (tú)</span>}
                      </span>
                    </div>
                    <div className="gp-jugador-avatar-grande" style={{ background: color }}>
                      {jugador.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="gp-jugador-recursos-fila">
                      <div className="gp-recurso-col">
                        <span className="gp-recurso-label-small">Minerales</span>
                        <span className="gp-recurso-valor-big">{recursosJugador?.minerales ?? 0}</span>
                      </div>
                      <div className="gp-recurso-col">
                        <span className="gp-recurso-label-small">Energía</span>
                        <span className="gp-recurso-valor-big">{recursosJugador?.energia ?? 0}</span>
                      </div>
                      <div className="gp-recurso-col">
                        <span className="gp-recurso-label-small">Cristales</span>
                        <span className="gp-recurso-valor-big">{recursosJugador?.cristales ?? 0}</span>
                      </div>
                    </div>
                    <div className="gp-jugador-planetas-row">
                      <span className="gp-planetas-label">Planetas</span>
                      <span className="gp-planetas-count" style={{ color }}>{jugador.sistemasConquistados}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="gp-modal-botones" style={{ marginTop: '16px' }}>
          <button className="gp-modal-btn gp-modal-cancelar" onClick={onCerrar}>
            CERRAR PANEL
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalFlotas({ accion, sistemaDestino, sistemasJugador, onConfirmar, onCancelar }) {
  const [paso, setPaso] = useState(1)
  const [sistemaOrigen, setSistemaOrigen] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const esAtaque = accion === 'ENVIAR_FLOTAS'

  const handleSistemaClick = (sistema) => {
    setSistemaOrigen(sistema)
    setPaso(2)
  }

  const handleVolver = () => {
    setPaso(1)
    setSistemaOrigen(null)
  }

  const handleConfirmar = () => {
    if (sistemaOrigen) {
      onConfirmar(sistemaOrigen, cantidad)
    }
  }

  // Paso 1: Seleccionar sistema de origen
  if (paso === 1) {
    return (
      <div className="gp-modal-overlay">
        <div className="gp-modal gp-modal-sistemas">
          <p className="gp-mf-etiqueta">{esAtaque ? 'ASALTO ORBITAL' : 'MANIOBRA DE FLOTA'}</p>
          <h2 className="gp-modal-titulo">{sistemaDestino?.nombre?.toUpperCase()}</h2>
          <p className="gp-modal-texto">Selecciona sistema de origen</p>

          <div className="gp-mf-sistemas-lista">
            {sistemasJugador && sistemasJugador.length > 0 ? (
              sistemasJugador.map(sis => (
                <button
                  key={sis.id}
                  className="gp-mf-sistema-btn"
                  onClick={() => handleSistemaClick(sis)}
                >
                  <div className="gp-mf-sistema-nombre">{sis.nombre}</div>
                  <div className="gp-mf-sistema-flotas">
                    Flotas: {sis.astillerosEstacionados ?? 0}
                  </div>
                </button>
              ))
            ) : (
              <p className="gp-mf-vacio">No tienes sistemas controlados</p>
            )}
          </div>

          <div className="gp-modal-botones">
            <button className="gp-modal-btn gp-modal-cancelar" onClick={onCancelar}>ABORTAR</button>
          </div>
        </div>
      </div>
    )
  }

  // Paso 2: Seleccionar cantidad
  const maxFlotas = sistemaOrigen?.astillerosEstacionados ?? 1

  return (
    <div className="gp-modal-overlay">
      <div className="gp-modal">
        <p className="gp-mf-etiqueta">{esAtaque ? 'ASALTO ORBITAL' : 'MANIOBRA DE FLOTA'}</p>
        <h2 className="gp-modal-titulo">{sistemaDestino?.nombre?.toUpperCase()}</h2>
        <p className="gp-modal-texto">Desde: {sistemaOrigen?.nombre}</p>
        <p className="gp-modal-texto">Unidades a despachar</p>

        <div className="gp-mf-cantidad-row">
          <button className="gp-mf-step-btn" onClick={() => setCantidad(cantidadActual => Math.max(1, cantidadActual - 1))}>−</button>
          <input
            type="number"
            min={1}
            max={maxFlotas}
            value={cantidad}
            onChange={evento => setCantidad(Math.max(1, Math.min(maxFlotas, Number(evento.target.value))))}
            className="gp-mf-input"
          />
          <button className="gp-mf-step-btn" onClick={() => setCantidad(cantidadActual => Math.min(maxFlotas, cantidadActual + 1))}>+</button>
        </div>
        <p className="gp-mf-max">Máximo: {maxFlotas}</p>

        <div className="gp-modal-botones">
          <button className="gp-modal-btn gp-modal-cancelar" onClick={handleVolver}>VOLVER</button>
          <button className="gp-modal-btn gp-modal-confirmar" onClick={handleConfirmar}>
            {esAtaque ? 'ATACAR' : 'MOVER'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Panel de info del sistema seleccionado (en sidebar) ─────────────────────
// ─── Panel de info del sistema seleccionado (en sidebar) ─────────────────────
function SistemaInfoPanel({ sistema, jugadores }) {
  if (!sistema) {
    return (
      <div className="gp-sistema-info-vacio">
        <span className="gp-sistema-info-hint">Selecciona un planeta para ver su información</span>
      </div>
    )
  }

  const colorMap = {}
  const COLORS = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316']
  ;(jugadores || []).forEach((j, i) => { colorMap[j.nombre] = COLORS[i % COLORS.length] })

  const colorDueno = sistema.propietario ? (colorMap[sistema.propietario] ?? '#718096') : null
  const prodTurno = sistema.produccion ?? { minerales: 0, energia: 0, cristales: 0 }
  const instalaciones = sistema.instalaciones || []
  const contar = (tipo) => instalaciones.filter(inst => inst.nombre === tipo).length

  return (
    <div className="gp-sistema-info-panel">
      <div className="gp-sistema-info-header">
        <div className="gp-sistema-info-nombre-row">
          <span className="gp-sistema-info-nombre">{sistema.nombre}</span>
          <span className={`gp-sistema-info-tipo gp-tag-tipo ${sistema.tipo?.toLowerCase()}`}>{sistema.tipo}</span>
        </div>
        {sistema.propietario && (
          <span className="gp-sistema-info-dueno" style={{ color: colorDueno }}>
            ◈ {sistema.propietario}
          </span>
        )}
        {!sistema.propietario && (
          <span className="gp-sistema-info-dueno gp-sistema-info-libre">Sector Libre</span>
        )}
      </div>

      <div className="gp-sistema-info-divider" />

      {/* Estructura modificada a 4 filas con alineación extrema (Nombre izq / Número der) */}
      <div className="gp-sistema-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="gp-sistema-info-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Minas:</span>
          <strong>{contar('Mina')}</strong>
        </div>
        <div className="gp-sistema-info-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Astilleros:</span>
          <strong>{contar('Astillero')}</strong>
        </div>
        <div className="gp-sistema-info-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Centrales de Inv.:</span>
          <strong>{contar('CentralInvestigacion')}</strong>
        </div>
        <div className="gp-sistema-info-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Fortalezas:</span>
          <strong>{contar('Fortaleza')}</strong>
        </div>
      </div>

      <div className="gp-sistema-info-divider" />

      <div className="gp-sistema-info-flotas-row">
        <span className="gp-sistema-info-flotas-label">Flotas en órbita</span>
        <span className="gp-sistema-info-flotas-val">{sistema.astillerosEstacionados ?? 0}</span>
      </div>

      <div className="gp-sistema-info-produccion">
        <div className="gp-sistema-info-prod-item">
          🪨 <span className="txt-minerales">+{prodTurno.minerales}</span>
        </div>
        <div className="gp-sistema-info-prod-item">
          ⚡ <span className="txt-energia">+{prodTurno.energia}</span>
        </div>
        <div className="gp-sistema-info-prod-item">
          💎 <span className="txt-cristales">+{prodTurno.cristales}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de jugador con nuevo diseño ──────────────────────────────────────
function JugadoresPanel({ jugadores, miSocketId, soloNombre }) {
  if (!jugadores || jugadores.length === 0) {
    return <div className="gp-empty">Sin jugadores</div>
  }
  return (
    <div className="gp-jugadores-lista">
      {jugadores.map((jugador, indice) => {
        if (soloNombre && jugador.nombre !== soloNombre) return null;
        const esYo = jugador.id === miSocketId
        const recursosJugador = jugador.recursos
        const color = getPlayerColor(indice)
        return (
          <div
            key={jugador.id || indice}
            className={`gp-jugador-card ${esYo ? 'gp-jugador-yo' : ''}`}
            style={{ '--player-color': color }}
          >
            <div className="gp-jugador-nombre-row">
              <span className="gp-jugador-nombre-text">
                {jugador.nombre}
                {esYo && <span className="gp-jugador-tag"> (tú)</span>}
              </span>
            </div>
            <div className="gp-jugador-avatar-grande" style={{ background: color }}>
              {jugador.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="gp-jugador-recursos-fila">
              <div className="gp-recurso-col">
                <span className="gp-recurso-label-small">Minerales</span>
                <span className="gp-recurso-valor-big">{recursosJugador?.minerales ?? 0}</span>
              </div>
              <div className="gp-recurso-col">
                <span className="gp-recurso-label-small">Energía</span>
                <span className="gp-recurso-valor-big">{recursosJugador?.energia ?? 0}</span>
              </div>
              <div className="gp-recurso-col">
                <span className="gp-recurso-label-small">Cristales</span>
                <span className="gp-recurso-valor-big">{recursosJugador?.cristales ?? 0}</span>
              </div>
            </div>
            <div className="gp-jugador-planetas-row">
              <span className="gp-planetas-label">Planetas</span>
              <span className="gp-planetas-count" style={{ color }}>{jugador.sistemasConquistados}</span>
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
  const [toastConstruccion, setToastConstruccion] = useState(null)
  const posicionSistemaRef = useRef({ x: 0, y: 0 })
  const sistemaSeleccionadoRef = useRef(null)

  useEffect(() => { idPartidaRef.current = idPartida }, [idPartida])

  useEffect(() => {
      function onChatMensaje(data) {
        if (data.idPartida && data.idPartida !== idPartidaRef.current) return
        setMensajes(mensajesPrevios => {
          if (mensajesPrevios.some(mensaje => mensaje.idLocal === data.idLocal)) return mensajesPrevios
          return [...mensajesPrevios, data]
        })
      }
      socket.on('chat_mensaje', onChatMensaje)
      return () => socket.off('chat_mensaje', onChatMensaje)
    }, [])

    useEffect(() => {
        if (!mensajesSistema || mensajesSistema.length === 0) return
        const ultimo = mensajesSistema[mensajesSistema.length - 1]
        setMensajes(mensajesPrevios => {
          if (mensajesPrevios.some(mensaje => mensaje.ts === ultimo.ts)) return mensajesPrevios
          return [...mensajesPrevios, ultimo]
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

  const handleKey = (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) { evento.preventDefault(); enviar() }
  }

  return (
      <div className="gp-chat-body">
        <div className="gp-chat-mensajes">
          {mensajes.length === 0 && (
            <p className="gp-chat-vacio">El chat está vacío. ¡Di algo, comandante!</p>
          )}

          {mensajes.map((mensaje, indice) => {
            const esSistema = mensaje.nombreJugador === 'Sistema';
            const esMio = !esSistema && mensaje.nombreJugador === nombreJugador;

            const jugadorIndex = jugadores ? jugadores.findIndex(jugador => jugador.nombre === mensaje.nombreJugador) : -1;
            const colorJugador = jugadorIndex !== -1 ? getPlayerColor(jugadorIndex) : '#ffffff';

            return (
              <div key={indice} className={`gp-chat-msg ${esMio ? 'gp-chat-self' : ''} ${esSistema ? 'gp-chat-sistema' : ''}`}
                style={esMio ? { opacity: 1 } : {}}
              >
                {esSistema ? (
                  <span className="gp-chat-texto">🔔 {mensaje.mensaje}</span>
                ) : (
                  <>
                    <span
                      className="gp-chat-autor"
                      style={{
                        color: colorJugador,
                        opacity: 1
                      }}
                    >
                      {mensaje.nombreJugador}
                    </span>
                    <span className="gp-chat-separador">:</span>
                    <span className="gp-chat-texto">{mensaje.mensaje}</span>
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
            onChange={evento => setTexto(evento.target.value)}
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
    color: '#f87171',
  },
  {
    id: 'CONSTR_MINA',
    tipoConstruccion: 'Mina',
    label: 'Construir Mina',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" />
        <path d="M6 20V10l6-8 6 8v10" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
    color: '#fb923c',
  },
  {
    id: 'CONSTR_CENTRAL',
    tipoConstruccion: 'CentralInvestigacion',
    label: 'Central Inv.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    color: '#38bdf8',
  },
  {
    id: 'CONSTR_ASTILLERO',
    tipoConstruccion: 'Astillero',
    label: 'Astillero',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 5 5 3-4 4 7H3z" />
        <path d="M3 21h18" />
      </svg>
    ),
    color: '#a78bfa',
  },
  {
    id: 'CONSTR_FORTALEZA',
    tipoConstruccion: 'Fortaleza',
    label: 'Fortaleza',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="1" />
        <path d="M3 11V7h3V4h3v3h6V4h3v3h3v4" />
      </svg>
    ),
    color: '#fbbf24',
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
    color: '#4ade80',
  },
]

function ToastConstruccion({ toast }) {
  if (!toast) return null;
  return (
    <div 
      className="gp-toast-construccion" 
      style={{ 
        position: 'fixed',
        left: toast.x, 
        top: toast.y,
        transform: 'translateX(-50%)',
        zIndex: 1100
      }}
    >
      {toast.texto}
    </div>
  );
}

function AccionesPanel({ partidaIniciada, sistemaSeleccionado, nombreJugador, onAccionClick }) {
  
  const obtenerDeshabilitado = (accionId) => {
    if (!partidaIniciada) return true

    if (accionId.startsWith('CONSTR_')) {
      return !sistemaSeleccionado || sistemaSeleccionado.propietario !== nombreJugador
    }

    if (!sistemaSeleccionado) return true

    const esPropietario = sistemaSeleccionado.propietario === nombreJugador
    const esEnemigo = sistemaSeleccionado.propietario && !esPropietario

    switch (accionId) {
      case 'ENVIAR_FLOTAS': return !esEnemigo && !!sistemaSeleccionado.propietario || !sistemaSeleccionado
      case 'MOVER_FLOTAS':  return !esPropietario
      default:              return true
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
              onClick={() => onAccionClick(accion)}
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
  const [mostrarModalJugadores, setMostrarModalJugadores] = useState(false)
  const [mensajesSistema, setMensajesSistema] = useState([])
  const [estadoPartida, setEstadoPartida] = useState(partida)
  const [jugadores, setJugadores] = useState(partida?.jugadores || [])
  const [accionFlotaActual, setAccionFlotaActual] = useState(null)
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null)
  const [modalFlotasVisible, setModalFlotasVisible] = useState(false)
  const [toastConstruccion, setToastConstruccion] = useState(null)
  const idPartidaRef = useRef(partida?.id)
  const posicionSistemaRef = useRef({ x: 0, y: 0 })
  const sistemaSeleccionadoRef = useRef(null)
  
  
  useEffect(() => {
    sistemaSeleccionadoRef.current = sistemaSeleccionado
  }, [sistemaSeleccionado])

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
    const handleActualizarClientes = (data) => {
      console.log('=== ACTUALIZANDO CLIENTES ===');
      console.log('Jugadores:', data.jugadores);
      if (data.galaxia && data.galaxia.sistemas) {
        console.log('Sistemas y sus astilleros:');
        data.galaxia.sistemas.forEach(s => {
          console.log(`  ${s.nombre}: ${s.astillerosEstacionados} astilleros, propietario: ${s.propietario || 'ninguno'}`);
        });
      }
      console.log('=========================');

      if (data.jugadores) setJugadores(data.jugadores)
      if (data.galaxia) {
        setEstadoPartida(prev => ({ ...prev, galaxia: data.galaxia }))
      }
    }

    const handleMoverFlotasExito = (data) => {
      console.log('=== MOVER FLOTAS EXITO ===');
      console.log('Mensaje:', data.mensaje);
      console.log('Origen:', data.origen);
      console.log('Destino:', data.destino);
      console.log('Cantidad:', data.cantidad);
      console.log('========================');
    }

    const handleMoverFlotasError = (data) => {
      console.log('=== MOVER FLOTAS ERROR ===');
      console.log('Mensaje:', data.mensaje);
      console.log('Errores:', data.errores);
      console.log('=======================');
      if (window.showAlert) {
        window.showAlert(data.mensaje)
      }
    }

    socket.on('actualizar_clientes', handleActualizarClientes)
    socket.on('mover_flotas_exito', handleMoverFlotasExito)
    socket.on('mover_flotas_error', handleMoverFlotasError)

    return () => {
      socket.off('actualizar_clientes', handleActualizarClientes)
      socket.off('mover_flotas_exito', handleMoverFlotasExito)
      socket.off('mover_flotas_error', handleMoverFlotasError)
    }
  }, [])

  useEffect(() => {
    const handleConstruccionExito = (data) => {
      const pos = posicionSistemaRef.current
      const sistema = sistemaSeleccionadoRef.current
      setToastConstruccion({
        texto: `${data.construccion?.nombre || data.construccion} construida exitosamente en ${sistema?.nombre}`,
        x: pos.x,
        y: pos.y
      })
      setTimeout(() => setToastConstruccion(null), 2000)
    }

    const handleConstruccionError = (data) => {
      console.log('=== CONSTRUCCIÓN ERROR ===');
      console.log('Mensaje:', data.mensaje);
      console.log('========================');
      if (window.showAlert) {
        window.showAlert(data.mensaje)
      }
    }

    socket.on('construccion_error', handleConstruccionError)
    socket.on('construccion_exito', handleConstruccionExito)
    return () => {
      socket.off('construccion_error', handleConstruccionError)
      socket.off('construccion_exito', handleConstruccionExito)
    }
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

  const handleAccionClick = useCallback((accion) => {
    if (accion.tipoConstruccion) {
      if (!sistemaSeleccionado) return
      if (sistemaSeleccionado.propietario !== nombreJugador) return
      socket.emit('construccion', {
        idPartida: idPartidaRef.current,
        nombreConstruccion: accion.tipoConstruccion,
        idSistema: sistemaSeleccionado.id
      })
      return
    }

    if (accion.id === 'ENVIAR_FLOTAS' || accion.id === 'MOVER_FLOTAS') {
      setAccionFlotaActual(accion.id)
      setModalFlotasVisible(true)
    }
  }, [sistemaSeleccionado, nombreJugador])

  const handleConfirmarFlotas = useCallback((sistemaOrigen, cantidad) => {
    console.log('=== ENVIANDO FLOTAS ===');
    console.log('Sistema Origen:', sistemaOrigen?.nombre, 'ID:', sistemaOrigen?.id);
    console.log('Sistema Destino:', sistemaSeleccionado?.nombre, 'ID:', sistemaSeleccionado?.id);
    console.log('Acción:', accionFlotaActual);
    console.log('Cantidad:', cantidad);
    console.log('=====================');

    socket.emit('mover_flotas', {
      idPartida: idPartidaRef.current,
      idSistemaOrigen: sistemaOrigen?.id,
      idSistemaDestino: sistemaSeleccionado?.id,
      accion: accionFlotaActual,
      cantidad
    })
    setModalFlotasVisible(false)
    setAccionFlotaActual(null)
  }, [sistemaSeleccionado, accionFlotaActual])

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

      {mostrarModalJugadores && (
        <ModalVerJugadores
          jugadores={jugadores}
          miSocketId={miSocketId}
          onCerrar={() => setMostrarModalJugadores(false)}
        />
      )}

      <Temporizador partidaIniciada={partidaIniciada} />

      <div className="gp-layout">

        <aside className="gp-sidebar">
          <div className="gp-frame gp-frame-sistema-info">
            <SistemaInfoPanel sistema={sistemaSeleccionado} jugadores={jugadores} />
          </div>
          <div className="gp-frame gp-frame-jugadores">
            <JugadoresPanel
              jugadores={jugadores}
              miSocketId={miSocketId}
              soloNombre={nombreJugador}
            />
          </div>
          <div className="gp-sidebar-footer">
            <button className="gp-jugadores-btn" onClick={() => setMostrarModalJugadores(true)}>
              Ver Jugadores
            </button>
            <button className="gp-salir-btn" onClick={() => setMostrarModalSalida(true)}>
              ← Salir
            </button>
          </div>
        </aside>

        <section className="gp-frame gp-frame-mapa">
          <div className="gp-frame-body gp-frame-body-mapa">
            <MapaArea
              estadoPartida={estadoPartida}
              jugadores={jugadores}
              onSistemaClick={(sis, posPopup, posToast) => {
                setSistemaSeleccionado(sis);
                posicionSistemaRef.current = posToast;
              }}
            />
          </div>
        </section>

        <div className="gp-right-col">
          <AccionesPanel 
            partidaIniciada={partidaIniciada} 
            sistemaSeleccionado={sistemaSeleccionado}
            nombreJugador={nombreJugador}
            onAccionClick={handleAccionClick}
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

          {modalFlotasVisible && (
            <ModalFlotas
              accion={accionFlotaActual}
              sistemaDestino={sistemaSeleccionado}
              sistemasJugador={estadoPartida?.galaxia?.sistemas?.filter(s => s.propietario === nombreJugador) || []}
              onConfirmar={handleConfirmarFlotas}
              onCancelar={() => setModalFlotasVisible(false)}
            />
          )}

          <ToastConstruccion toast={toastConstruccion} />

      </div>
    </div>
  )
}