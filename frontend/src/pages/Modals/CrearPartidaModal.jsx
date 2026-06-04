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
}) {
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
            />
          </div>

          <div className="gc-modal-grid-2">
            <div className="gc-field-group">
              <label className="gc-label">Galaxia</label>
              <select className="gc-input gc-select" value={galaxia} onChange={e => setGalaxia(e.target.value)}>
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
              />
            </div>

            <div className="gc-field-group">
              <label className="gc-label">Recursos Iniciales</label>
              <select className="gc-input gc-select" value={recursos} onChange={e => setRecursos(e.target.value)}>
                <option value="Bajo">Bajo (200M, 100E, 40C)</option>
                <option value="Normal">Normal (500M, 250E, 100C)</option>
                <option value="Alto">Alto (1000M, 500E, 200C)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="gc-actions-row2">
          <button className="gc-btn gc-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="gc-btn gc-btn-primary" onClick={() => alert('[RF-02/RF-03] Solicitud WebSocket enviada para registrar partida nueva.')}>
            Inicializar
          </button>
        </div>
      </section>
    </div>
  )
}
