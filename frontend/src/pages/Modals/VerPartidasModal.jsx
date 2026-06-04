export default function VerPartidasModal({ onClose }) {
  const partidas = [
    {
      id: '#PART-5421',
      galaxia: 'Sector Centauri',
      jugadores: '2 / 4',
      estado: 'Abierta',
      isOpen: true,
    },
    {
      id: '#PART-7834',
      galaxia: 'Vía Láctea Prime',
      jugadores: '3 / 4',
      estado: 'Abierta',
      isOpen: true,
    },
    {
      id: '#PART-3102',
      galaxia: 'Sector Centauri',
      jugadores: '4 / 4',
      estado: 'Llena',
      isOpen: false,
    },
  ]

  return (
    <div className="gc-modal-overlay">
      <section className="gc-card gc-modal-content gc-modal-wide">
        <header className="gc-modal-header">
          <h2 className="gc-modal-title">PARTIDAS EN TIEMPO REAL</h2>
          <p className="gc-hint">[RF-05/RF-06] Canal WebSocket activo. Selecciona una partida disponible.</p>
        </header>

        <div className="gc-modal-body">
          <div className="gc-table-wrapper">
            <table className="gc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Galaxia</th>
                  <th>Jugadores</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map(partida => (
                  <tr key={partida.id}>
                    <td>{partida.id}</td>
                    <td>{partida.galaxia}</td>
                    <td>{partida.jugadores}</td>
                    <td className={partida.isOpen ? 'status-open' : 'status-closed'}>
                      {partida.estado}
                    </td>
                    <td>
                      <button 
                        className={`gc-btn ${partida.isOpen ? 'gc-btn-primary' : 'gc-btn-ghost'} gc-btn-small`}
                        disabled={!partida.isOpen}
                        onClick={() => partida.isOpen && alert('[RF-06] Entrando a sala de espera. Status: Aceptado.')}
                      >
                        {partida.isOpen ? 'Unirse' : 'Llena'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="gc-btn gc-btn-ghost" onClick={onClose}>Volver al Menú</button>
      </section>
    </div>
  )
}
