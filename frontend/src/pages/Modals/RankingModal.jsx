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
                    <th>Posición</th>
                    <th>Comandante Ganador</th>
                    <th>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((ranking) => (
                    <tr key={ranking.posicion}>
                      <td style={{ fontWeight: 'bold', color: '#0ff' }}>#{ranking.posicion}</td>
                      <td className="text-highlight">{ranking.jugador}</td>
                      <td>{ranking.puntos.toLocaleString()}</td>
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
