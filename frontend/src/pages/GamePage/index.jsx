import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../../hooks/useSocket'
import './index.css'

function PlanetasFrame({ partida }) {
  if (!partida) return <div className="gp-empty">Cargando sistemas...</div>

  const jugadores = partida.jugadores || []
  const sistemasEjemplo = [
    { id: 1, nombre: 'Orion Prime', tipo: 'Gaseoso', propietario: jugadores[0]?.nombre || null, recursos: 'Alto' },
    { id: 2, nombre: 'Centauri IV', tipo: 'Rocoso', propietario: jugadores[1]?.nombre || null, recursos: 'Medio' },
    { id: 3, nombre: 'Vega Station', tipo: 'Árido', propietario: null, recursos: 'Bajo' },
    { id: 4, nombre: 'Proxima B', tipo: 'Oceánico', propietario: null, recursos: 'Alto' },
    { id: 5, nombre: 'Tau Ceti III', tipo: 'Helado', propietario: null, recursos: 'Medio' },
    { id: 6, nombre: 'Sirius Alpha', tipo: 'Volcánico', propietario: null, recursos: 'Bajo' },
  ]

  return (
    <div className="gp-planetas-grid">
      {sistemasEjemplo.map(s => (
        <div key={s.id} className={`gp-planeta-card ${s.propietario ? 'gp-planeta-owned' : 'gp-planeta-free'}`}>
          <div className="gp-planeta-icon">{tipoIcono(s.tipo)}</div>
          <div className="gp-planeta-info">
            <span className="gp-planeta-nombre">{s.nombre}</span>
            <span className="gp-planeta-tipo">{s.tipo} · {s.recursos}</span>
            <span className={`gp-planeta-owner ${s.propietario ? 'owned' : 'free'}`}>
              {s.propietario ? `⚑ ${s.propietario}` : '[ Libre ]'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function tipoIcono(tipo) {
  const iconos = { 'Gaseoso': '🪐', 'Rocoso': '🌑', 'Árido': '🏜️', 'Oceánico': '🌊', 'Helado': '❄️', 'Volcánico': '🌋' }
  return iconos[tipo] || '🌍'
}

function EstadosFrame({ partida, jugadoresConectados }) {
  if (!partida) return <div className="gp-empty">Sin datos</div>

  const jugadores = partida.jugadores || []
  const recursosBase = { Bajo: { m: 200, e: 100, c: 40 }, Normal: { m: 500, e: 250, c: 100 }, Alto: { m: 1000, e: 500, c: 200 } }
  const r = recursosBase[partida.recursos] || recursosBase.Normal

  return (
    <div className="gp-estados-body">
      <div className="gp-estado-seccion">
        <h4 className="gp-estado-titulo">⚙ PARTIDA</h4>
        <div className="gp-estado-fila"><span>Nombre</span><span>{partida.nombre}</span></div>
        <div className="gp-estado-fila"><span>Galaxia</span><span>{partida.galaxia}</span></div>
        <div className="gp-estado-fila"><span>Duración</span><span>{partida.duracion} min</span></div>
        <div className="gp-estado-fila"><span>Estado</span><span className="status-open">{partida.estado?.toUpperCase()}</span></div>
      </div>

      <div className="gp-estado-seccion">
        <h4 className="gp-estado-titulo">👥 JUGADORES ({jugadores.length}/{partida.maxJugadores})</h4>
        {jugadores.map((j, i) => (
          <div key={i} className="gp-estado-fila">
            <span>⚑ {j.nombre}</span>
            <span className="status-open">En sala</span>
          </div>
        ))}
        {jugadores.length < partida.maxJugadores && (
          <div className="gp-estado-fila gp-esperando">
            <span>Esperando {partida.maxJugadores - jugadores.length} jugador(es)...</span>
          </div>
        )}
      </div>

      <div className="gp-estado-seccion">
        <h4 className="gp-estado-titulo">💎 RECURSOS INICIALES</h4>
        <div className="gp-estado-fila"><span>🪨 Minerales</span><span>{r.m}</span></div>
        <div className="gp-estado-fila"><span>⚡ Energía</span><span>{r.e}</span></div>
        <div className="gp-estado-fila"><span>💎 Cristales</span><span>{r.c}</span></div>
      </div>

      <div className="gp-estado-seccion">
        <h4 className="gp-estado-titulo">🌐 CONEXIONES</h4>
        <div className="gp-estado-fila"><span>Online</span><span className="status-open">{jugadoresConectados} jugadores</span></div>
      </div>
    </div>
  )
}

function ChatFrame({ nombreJugador, idPartida }) {
  const { emit, on } = useSocket()
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const unsub = on('chat_mensaje', (data) => {
      setMensajes(prev => [...prev, data])
    })
    return unsub
  }, [on])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = () => {
    const msg = texto.trim()
    if (!msg) return
    emit('chat_mensaje', {
      idPartida,
      nombreJugador,
      mensaje: msg
    })
    setTexto('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="gp-chat-body">
      <div className="gp-chat-mensajes">
        {mensajes.length === 0 && (
          <p className="gp-chat-vacio">El chat está vacío. ¡Di algo, comandante!</p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`gp-chat-msg ${m.nombreJugador === nombreJugador ? 'gp-chat-self' : ''}`}>
            <span className="gp-chat-autor">{m.nombreJugador}</span>
            <span className="gp-chat-separador">:</span>
            <span className="gp-chat-texto">{m.mensaje}</span>
          </div>
        ))}
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
  const { on } = useSocket()
  const [partidaActual, setPartidaActual] = useState(partida)
  const [jugadoresConectados, setJugadoresConectados] = useState(0)

  useEffect(() => {
    const unsub1 = on('jugador_unido', (data) => {
      if (data.idPartida === partidaActual?.id) {
        setPartidaActual(prev => ({
          ...prev,
          jugadores: [...(prev?.jugadores || []), data.jugador]
        }))
      }
    })
    const unsub2 = on('actualizar_jugadores', (jugadores) => {
      setJugadoresConectados(jugadores.length)
    })
    return () => { unsub1(); unsub2() }
  }, [on, partidaActual?.id])

  return (
    <div className="gp-root">
      {/* Header */}
      <header className="gp-header">
        <div className="gp-header-left">
          <span className="gp-logo">⬡ COLONIAS GALÁCTICAS</span>
          <span className="gp-partida-nombre">{partidaActual?.nombre}</span>
        </div>
        <div className="gp-header-right">
          <span className="gp-comandante">⚑ {nombreJugador}</span>
          <button className="gp-salir-btn" onClick={onSalir}>← SALIR</button>
        </div>
      </header>

      {/* Main layout: 3 frames */}
      <div className="gp-layout">

        {/* Frame izquierdo: Planetas */}
        <section className="gp-frame gp-frame-planetas">
          <div className="gp-frame-header">
            <span className="gp-frame-icon">🪐</span>
            <span>SISTEMAS PLANETARIOS</span>
          </div>
          <div className="gp-frame-body">
            <PlanetasFrame partida={partidaActual} />
          </div>
        </section>

        {/* Frame derecho: Estados + Chat */}
        <div className="gp-right-col">

          {/* Frame estados */}
          <section className="gp-frame gp-frame-estados">
            <div className="gp-frame-header">
              <span className="gp-frame-icon">📊</span>
              <span>ESTADO DE PARTIDA</span>
            </div>
            <div className="gp-frame-body">
              <EstadosFrame partida={partidaActual} jugadoresConectados={jugadoresConectados} />
            </div>
          </section>

          {/* Frame chat */}
          <section className="gp-frame gp-frame-chat">
            <div className="gp-frame-header">
              <span className="gp-frame-icon">💬</span>
              <span>COMUNICACIONES</span>
            </div>
            <ChatFrame nombreJugador={nombreJugador} idPartida={partidaActual?.id} />
          </section>

        </div>
      </div>
    </div>
  )
}
