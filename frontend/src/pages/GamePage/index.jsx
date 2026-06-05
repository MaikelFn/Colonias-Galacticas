import { useState, useEffect, useRef, useCallback } from 'react'
import socket from '../../services/socket'
import './index.css'

// ─── Temporizador ─────────────────────────────────────────────────────────────
function Temporizador({ duracionMin, partidaIniciada }) {
  const totalSeg = duracionMin * 60
  const [segsRestantes, setSegsRestantes] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!partidaIniciada) { setSegsRestantes(null); return }
    setSegsRestantes(totalSeg)
    intervalRef.current = setInterval(() => {
      setSegsRestantes(prev => {
        if (prev === null || prev <= 0) { clearInterval(intervalRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [partidaIniciada, totalSeg])

  const formatTime = (secs) => {
    if (secs === null) return '--:--'
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const isRojo = segsRestantes !== null && segsRestantes <= 120

  return (
    <div className="gp-timer-block">
      <span className={`gp-timer-display ${isRojo ? 'gp-timer-red' : ''}`}>
        {formatTime(segsRestantes)}
      </span>
      <span className="gp-timer-label">{duracionMin} Minutos</span>
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

function JugadoresPanel({ jugadores, miSocketId }) {
  if (!jugadores || jugadores.length === 0) {
    return <div className="gp-empty">Sin jugadores</div>
  }
  return (
    <div className="gp-jugadores-lista">
      {jugadores.map((j, i) => {
        const esYo = j.id === miSocketId
        const r = j.recursos
        const planetas = j.sistemasConquistados
        return (
          <div key={j.id || i} className={`gp-jugador-card ${esYo ? 'gp-jugador-yo' : ''}`}>
            <div className="gp-jugador-header">
              <span className="gp-jugador-avatar">{j.nombre.charAt(0).toUpperCase()}</span>
              <span className="gp-jugador-nombre">
                {j.nombre}
                {esYo && <span className="gp-jugador-tag"> (tú)</span>}
              </span>
            </div>
            <div className="gp-jugador-recursos">
              <div className="gp-recurso-fila">
                <span className="gp-recurso-icono">🪨</span>
                <span className="gp-recurso-label">Minerales</span>
                <span className="gp-recurso-valor">{r.minerales}</span>
              </div>
              <div className="gp-recurso-fila">
                <span className="gp-recurso-icono">⚡</span>
                <span className="gp-recurso-label">Energía</span>
                <span className="gp-recurso-valor">{r.energia}</span>
              </div>
              <div className="gp-recurso-fila">
                <span className="gp-recurso-icono">💎</span>
                <span className="gp-recurso-label">Cristales</span>
                <span className="gp-recurso-valor">{r.cristales}</span>
              </div>
            </div>
            <div className="gp-jugador-planetas">
              <span className="gp-planetas-label">Planetas conquistados:</span>
              <span className="gp-planetas-count">{planetas}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Área de mapa ─────────────────────────────────────────────────────────────
function MapaArea() {
  return (
    <div className="gp-mapa-area">
      {/* Zona reservada para el mapa navegable con nodos de planetas */}
    </div>
  )
}


function ChatFrame({ nombreJugador, idPartida, mensajesSistema }) {
  const [mensajes, setMensajes] = useState([])
  const bottomRef = useRef(null)
  const [texto, setTexto] = useState('')
  const idPartidaRef = useRef(idPartida)
  useEffect(() => { idPartidaRef.current = idPartida }, [idPartida])

  useEffect(() => {
    function onChatMensaje(data) {
      if (data.idPartida && data.idPartida !== idPartidaRef.current) return
      setMensajes(prev => [...prev, data])
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
    socket.emit('chat_mensaje', { idPartida: idPartidaRef.current, nombreJugador, mensaje: msg })
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
          const esSistema = m.nombreJugador === 'Sistema'
          const esMio = !esSistema && m.nombreJugador === nombreJugador
          return (
            <div key={i} className={`gp-chat-msg ${esMio ? 'gp-chat-self' : ''} ${esSistema ? 'gp-chat-sistema' : ''}`}>
              {esSistema ? (
                <span className="gp-chat-texto">🔔 {m.mensaje}</span>
              ) : (
                <>
                  <span className="gp-chat-autor">{m.nombreJugador}</span>
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

export default function GamePage({ partida, nombreJugador, onSalir }) {
  const [partidaActual]               = useState(partida)
  const [jugadores, setJugadores]     = useState(() => partida.jugadores)
  const [miSocketId, setMiSocketId]   = useState(null)
  const [partidaIniciada, setPartidaIniciada] = useState(partida?.estado === 'iniciada')
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false)

  const [mensajesSistema, setMensajesSistema] = useState([])

  const idPartidaRef = useRef(partida?.id)
  const nombreRef    = useRef(nombreJugador)

  useEffect(() => {
    const yo = jugadores.find(j => j.nombre === nombreJugador)
    if (yo?.id) setMiSocketId(yo.id)
  }, [jugadores, nombreJugador])

  useEffect(() => {

    function onJugadorUnido(data) {
      if (data.idPartida !== idPartidaRef.current) return
      setJugadores(prev => {
        if (prev.find(j => j.id === data.jugador.id)) return prev
        return [...prev, {
          ...data.jugador,
          recursos: data.jugador.recursos,
          sistemasConquistados: data.jugador.sistemasConquistados,
        }]
      })
    }

    function onJugadorSalio(data) {
      if (data.idPartida !== idPartidaRef.current) return
      setJugadores(prev => {
        const saliente = prev.find(
          j => j.id === data.jugadorId || j.nombre === data.nombreJugador
        )
        const nombre = saliente.nombre
        setMensajesSistema(ms => [...ms, {
          nombreJugador: 'Sistema',
          mensaje: `${nombre} ha abandonado la partida.`,
          ts: Date.now(),
        }])
        return prev.filter(
          j => j.id !== data.jugadorId && j.nombre !== data.nombreJugador
        )
      })
    }

    function onActualizarClientes(data) {
      if (data.idPartida && data.idPartida !== idPartidaRef.current) return
      if (data.jugadores) {
        setJugadores(data.jugadores.map(j => ({
          ...j,
          recursos: j.recursos,
          sistemasConquistados: j.sistemasConquistados,
        })))
      }
    }

    function onEstadoJugadores(data) {
      if (data.idPartida && data.idPartida !== idPartidaRef.current) return
      const lista = Array.isArray(data) ? data : data.jugadores
      if (!Array.isArray(lista)) return
      setJugadores(lista.map(j => ({
        ...j,
        recursos: j.recursos,
        sistemasConquistados: j.sistemasConquistados,
      })))
    }

    function onPartidaIniciada(data) {
      const idRecibido = data.idPartida
      if (idRecibido && idRecibido !== idPartidaRef.current) return
      if (data.jugadores) {
        setJugadores(data.jugadores.map(j => ({
          ...j,
          recursos: j.recursos,
          sistemasConquistados: j.sistemasConquistados,
        })))
      }
      setPartidaIniciada(true)
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

    socket.on('jugador_unido',         onJugadorUnido)
    socket.on('jugador_salio',         onJugadorSalio)
    socket.on('actualizar_clientes',   onActualizarClientes)
    socket.on('estado_jugadores',      onEstadoJugadores)
    socket.on('partida_iniciada',      onPartidaIniciada)
    socket.on('planeta_conquistado',   onPlanetaConquistado)

    return () => {
      socket.off('jugador_unido',         onJugadorUnido)
      socket.off('jugador_salio',         onJugadorSalio)
      socket.off('actualizar_clientes',   onActualizarClientes)
      socket.off('estado_jugadores',      onEstadoJugadores)
      socket.off('partida_iniciada',      onPartidaIniciada)
      socket.off('planeta_conquistado',   onPlanetaConquistado)
    }
  }, [])

  const handleConfirmarSalida = useCallback(() => {
    socket.emit('abandonar_partida', {
      idPartida: idPartidaRef.current,
      nombreJugador: nombreRef.current,
    })
    setMostrarModalSalida(false)
    onSalir()
  }, [onSalir])

  const duracionMin = partidaActual.duracion

  return (
    <div className="gp-root">
      {mostrarModalSalida && (
        <ModalConfirmarSalida
          onConfirmar={handleConfirmarSalida}
          onCancelar={() => setMostrarModalSalida(false)}
        />
      )}

      <header className="gp-header">
        <div className="gp-header-left">
          <span className="gp-logo">⬡ COLONIAS GALÁCTICAS</span>
          <span className="gp-partida-nombre">{partidaActual?.nombre}</span>
        </div>

        <Temporizador duracionMin={duracionMin} partidaIniciada={partidaIniciada} />

        <div className="gp-header-right">
          <span className="gp-comandante">⚑ {nombreJugador}</span>
          <button className="gp-salir-btn" onClick={() => setMostrarModalSalida(true)}>← SALIR</button>
        </div>
      </header>

      <div className="gp-layout">

        <section className="gp-frame gp-frame-jugadores">
          <div className="gp-frame-header">
            <span className="gp-frame-icon">👥</span>
            <span>JUGADORES</span>
          </div>
          <div className="gp-frame-body">
            <JugadoresPanel jugadores={jugadores} miSocketId={miSocketId} />
          </div>
        </section>

        <section className="gp-frame gp-frame-mapa">
          <div className="gp-frame-header">
            <span className="gp-frame-icon">🗺</span>
            <span>MAPA GALÁCTICO</span>
          </div>
          <div className="gp-frame-body gp-frame-body-mapa">
            <MapaArea />
          </div>
        </section>

        <section className="gp-frame gp-frame-chat">
          <div className="gp-frame-header">
            <span className="gp-frame-icon">💬</span>
            <span>COMUNICACIONES</span>
          </div>
          <ChatFrame
            nombreJugador={nombreJugador}
            idPartida={partidaActual?.id}
            mensajesSistema={mensajesSistema}
          />
        </section>

      </div>
    </div>
  )
}