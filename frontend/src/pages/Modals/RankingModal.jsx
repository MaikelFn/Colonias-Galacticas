import { useState, useEffect } from 'react'
import { useSocket } from '../../hooks/useSocket'

export default function RankingModal({ onClose }) {
  const { emit, on } = useSocket()
  const [rankings, setRankings] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    emit('obtener_ranking')
    setCargando(true)

    const unsubscribe = on('ranking_disponible', (data) => {
      setRankings(data)
      setCargando(false)
    })

    return unsubscribe
  }, [emit, on])

  return (
    <div className="gc-modal-overlay">
      <section className="gc-card gc-modal-content gc-modal-wide">
        <header className="gc-modal-header">
          <h2 className="gc-modal-title">SALÓN DE LA INFAMIA GALÁCTICA</h2>
          <p className="gc-hint">[RF-23] Historial persistido en base de datos central planetaria.</p>
        </header>

        <div className="gc-modal-body">
          {cargando ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#0ff' }}>Cargando ranking...</p>
          ) : rankings.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#0ff' }}>No hay datos de ranking disponibles</p>
          ) : (
            <div className="gc-table-wrapper">
              <table className="gc-table">
                <thead>
                  <tr>
                    <th>ID Partida</th>
                    <th>Fecha</th>
                    <th>Ganador</th>
                    <th>Sistemas</th>
                    <th>Recursos</th>
                    <th>Galaxia</th>
                    <th>Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((ranking, index) => (
                    <tr key={ranking.idPartida || index}>
                      <td style={{ color: '#0ff', fontSize: '0.8em' }}>{ranking.idPartida}</td>
                      <td style={{ color: '#0ff' }}>{new Date(ranking.fecha).toLocaleDateString()}</td>
                      <td className="text-highlight">{ranking.nombreGanador}</td>
                      <td>{ranking.sistemasControlados}</td>
                      <td>
                        {ranking.recursosAcumulados && typeof ranking.recursosAcumulados === 'object' ? (
                          <span style={{ fontSize: '0.85em' }}>
                            M: {ranking.recursosAcumulados.minerales || 0}, 
                            E: {ranking.recursosAcumulados.energia || 0}, 
                            C: {ranking.recursosAcumulados.cristales || 0}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{ranking.galaxia}</td>
                      <td>{ranking.tiempoPartida}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button className="gc-btn gc-btn-ghost" onClick={onClose}>Cerrar Historial</button>
      </section>
    </div>
  )
}
