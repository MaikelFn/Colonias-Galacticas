import { useState } from 'react'
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
  const { emit } = useSocket()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const handleCrearPartida = () => {
    if (!nombrePartida.trim()) {
      setError('Ingresa un nombre para la partida')
      return
    }

    setEnviando(true)
    setError(null)

    emit('crear_partida', {
      nombre: nombrePartida,
      galaxia,
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
              <select className="gc-input gc-select" value={galaxia} onChange={e => setGalaxia(e.target.value)} disabled={enviando}>
                <option value="Sector Centauri">Sector Centauri</option>
                <option value="Vía Láctea Prime">Vía Láctea Prime</option>
                <option value="Triángulo Austral">Triángulo Austral</option>
              </select>
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
              <select className="gc-input gc-select" value={recursos} onChange={e => setRecursos(e.target.value)} disabled={enviando}>
                <option value="Bajo">Bajo (200M, 100E, 40C)</option>
                <option value="Normal">Normal (500M, 250E, 100C)</option>
                <option value="Alto">Alto (1000M, 500E, 200C)</option>
              </select>
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
