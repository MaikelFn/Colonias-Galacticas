import { useState, useEffect } from 'react'
import { useSocket } from '../../hooks/useSocket'

export default function CrearPartidaModal({
  onClose,
  nombrePartida,
  setNombrePartida,
  galaxia,
  setGalaxia,
  maxJugadores,
  setMaxJugadores,
  duracion,
  setDuracion,
  recursos,
  setRecursos,
  comandante
}) {
  const { emit, on } = useSocket()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [galaxiasDisponibles, setGalaxiasDisponibles] = useState([])
  const [cargandoGalaxias, setCargandoGalaxias] = useState(true)
  const [recursosConfig, setRecursosConfig] = useState({})
  const [cargandoRecursos, setCargandoRecursos] = useState(true)

  useEffect(() => {
    emit('obtener_galaxias')
    const unsub = on('galaxias_disponibles', (data) => {
      setGalaxiasDisponibles(data)
      setCargandoGalaxias(false)
      // Seleccionar la primera galaxia por defecto si no hay ninguna seleccionada
      if (!galaxia && data.length > 0) {
        setGalaxia(data[0].id)
      }
    })
    return unsub
  }, [emit, on, galaxia, setGalaxia])

  useEffect(() => {
    emit('obtener_configuracion')
    const unsub = on('configuracion_recursos', (data) => {
      setRecursosConfig(data)
      setCargandoRecursos(false)
      // Seleccionar la primera opción por defecto si no hay ninguna seleccionada
      if (!recursos && Object.keys(data).length > 0) {
        const primeraOpcion = Object.keys(data)[0]
        setRecursos(primeraOpcion)
      }
    })
    return unsub
  }, [emit, on, recursos, setRecursos])

  const handleCrearPartida = () => {
    if (!nombrePartida.trim()) {
      setError('Ingresa un nombre para la partida')
      return
    }

    setEnviando(true)
    setError(null)

    const galaxiaSeleccionada = galaxiasDisponibles.find(g => g.id === galaxia)
    const nombreGalaxia = galaxiaSeleccionada ? galaxiaSeleccionada.nombre : galaxia

    emit('crear_partida', {
      nombre: nombrePartida,
      galaxiaId: galaxia,
      galaxia: nombreGalaxia,
      maxJugadores,
      duracion,
      recursos,
      comandante
    })

    // Cerrar después de crear
    setTimeout(() => {
      setEnviando(false)
      onClose()
    }, 500)
  }

  return (
    <div className="gc-modal-overlay">
      <section className="gc-card gc-modal-content">
        <header className="gc-modal-header">
          <h2 className="gc-modal-title">CONFIGURAR NUEVA PARTIDA</h2>
          <p className="gc-hint">[RF-02/RF-03] Ajusta los parámetros para inicializar el nexo galáctico.</p>
        </header>

        <div className="gc-modal-body">
          <div className="gc-field-group">
            <label className="gc-label">Nombre de la Sala</label>
            <input 
              className="gc-input" 
              type="text" 
              placeholder="Ej: Flota Alfa..." 
              value={nombrePartida}
              onChange={e => setNombrePartida(e.target.value)}
              disabled={enviando}
            />
          </div>

          <div className="gc-modal-grid-2">
            <div className="gc-field-group">
              <label className="gc-label">Galaxia</label>
              {cargandoGalaxias ? (
                <select className="gc-input gc-select" disabled>
                  <option>Cargando galaxias...</option>
                </select>
              ) : (
                <select className="gc-input gc-select" value={galaxia} onChange={e => setGalaxia(e.target.value)} disabled={enviando}>
                  {galaxiasDisponibles.length > 0 ? (
                    galaxiasDisponibles.map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))
                  ) : (
                    <option value="">No hay galaxias disponibles</option>
                  )}
                </select>
              )}
            </div>

            <div className="gc-field-group">
              <label className="gc-label">Máx. Jugadores</label>
              <input 
                className="gc-input" 
                type="number" 
                min="2" 
                max="8" 
                value={maxJugadores}
                onChange={e => setMaxJugadores(parseInt(e.target.value) || 4)}
                disabled={enviando}
              />
            </div>
          </div>

          <div className="gc-modal-grid-2">
            <div className="gc-field-group">
              <label className="gc-label">Tiempo Límite (min)</label>
              <input 
                className="gc-input" 
                type="number" 
                step="5" 
                value={duracion}
                onChange={e => setDuracion(parseInt(e.target.value) || 20)}
                disabled={enviando}
              />
            </div>

            <div className="gc-field-group">
              <label className="gc-label">Recursos Iniciales</label>
              {cargandoRecursos ? (
                <select className="gc-input gc-select" disabled>
                  <option>Cargando configuración...</option>
                </select>
              ) : (
                <select className="gc-input gc-select" value={recursos} onChange={e => setRecursos(e.target.value)} disabled={enviando}>
                  {Object.keys(recursosConfig).length > 0 ? (
                    Object.entries(recursosConfig).map(([key, value]) => (
                      <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({value.minerales}M, {value.energia}E, {value.cristales}C)
                      </option>
                    ))
                  ) : (
                    <option value="">No hay configuración disponible</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {error && <p className="gc-error" style={{ color: '#ff6b6b', marginTop: '10px' }}>{error}</p>}
        </div>

        <div className="gc-actions-row2">
          <button className="gc-btn gc-btn-ghost" onClick={onClose} disabled={enviando}>Cancelar</button>
          <button className="gc-btn gc-btn-primary" onClick={handleCrearPartida} disabled={enviando || !nombrePartida.trim()}>
            {enviando ? 'Inicializando...' : 'Inicializar'}
          </button>
        </div>
      </section>
    </div>
  )
}
