export default function RankingModal({ onClose }) {
  const rankings = [
    {
      comandante: 'Commander_Zephyr',
      sistemas: '24 / 32',
      recursos: '7,850 u',
      galaxia: 'Sector Centauri',
      partida: '#PART-2501',
    },
    {
      comandante: 'Nova_Dominion',
      sistemas: '28 / 32',
      recursos: '12,450 u',
      galaxia: 'Vía Láctea Prime',
      partida: '#PART-2487',
    },
    {
      comandante: 'Eclipse_Seven',
      sistemas: '20 / 32',
      recursos: '5,920 u',
      galaxia: 'Triángulo Austral',
      partida: '#PART-2412',
    },
  ]

  return (
    <div className="gc-modal-overlay">
      <section className="gc-card gc-modal-content gc-modal-wide">
        <header className="gc-modal-header">
          <h2 className="gc-modal-title">SALÓN DE LA INFAMIA GALÁCTICA</h2>
          <p className="gc-hint">[RF-23] Historial persistido en base de datos central planetaria.</p>
        </header>

        <div className="gc-modal-body">
          <div className="gc-table-wrapper">
            <table className="gc-table">
              <thead>
                <tr>
                  <th>Comandante Ganador</th>
                  <th>Sistemas</th>
                  <th>Recursos Totales</th>
                  <th>Galaxia</th>
                  <th>ID Partida</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((ranking, index) => (
                  <tr key={index}>
                    <td className="text-highlight">{ranking.comandante}</td>
                    <td>{ranking.sistemas}</td>
                    <td>{ranking.recursos}</td>
                    <td>{ranking.galaxia}</td>
                    <td>{ranking.partida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="gc-btn gc-btn-ghost" onClick={onClose}>Cerrar Historial</button>
      </section>
    </div>
  )
}
