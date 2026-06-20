import { useState, useEffect } from 'react'
import { useSocket } from '../../hooks/useSocket'

/**
 * Modal que muestra las partidas disponibles para unirse.
 * Permite ver partidas en tiempo real y unirse a ellas.
 * 
 * @param {Function} onClose - Callback para cerrar el modal.
 * @param {string} comandante - Nombre del comandante que intenta unirse.
 * @param {Function} onUnirse - Callback cuando se une exitosamente a una partida.
 * @param {Function} addToast - Función para mostrar notificaciones.
 * @returns {JSX.Element} El modal de partidas disponibles.
 */
export default function VerPartidasModal({ onClose, comandante, onUnirse, addToast }) {
  const { emit, on } = useSocket()
  const [partidas, setPartidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [uniendose, setUniendose] = useState(null)

  useEffect(() => {
    emit('obtener_partidas')
    setCargando(true)

    const unsub1 = on('partidas_disponibles', (data) => {
      setPartidas(data)
      setCargando(false)
    })

    const unsub2 = on('partida_unida', (partida) => {
      setUniendose(null)
      if (onUnirse) {
        onUnirse(partida)
      } else {
        onClose()
      }
    })

    const unsub3 = on('error_unirse', (error) => {
      setUniendose(null)
      if (addToast) {
        addToast('Error al unirse', error.mensaje, 'peligro')
      }
    })

    return () => { unsub1(); unsub2(); unsub3() }
  }, [emit, on, onUnirse, onClose])

  /**
   * Maneja la acción de unirse a una partida específica.
   * @param {Object} partida - Datos de la partida a unirse.
   */
  const handleUnirse = (partida) => {
    if (!comandante) {
      if (addToast) {
        addToast('Error', 'Comandante no identificado', 'peligro')
      }
      return
    }

    setUniendose(partida.id)
    emit('unirse_partida', {
      idPartida: partida.id,
      nombreJugador: comandante
    })
  }

  return (
    <div className="gc-modal-overlay">
      <section className="gc-card gc-modal-content gc-modal-wide">
        <header className="gc-modal-header">
          <h2 className="gc-modal-title">PARTIDAS EN TIEMPO REAL</h2>
          <p className="gc-hint">[RF-05/RF-06] Canal WebSocket activo. Selecciona una partida disponible.</p>
        </header>

        <div className="gc-modal-body">
          {cargando ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#0ff' }}>Cargando partidas...</p>
          ) : partidas.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#0ff' }}>No hay partidas disponibles en este momento</p>
          ) : (
            <div className="gc-table-wrapper">
              <table className="gc-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Galaxia</th>
                    <th>Jugadores</th>
                    <th>Duración</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {partidas.map(partida => {
                    const jugadoresActuales = partida.jugadores.length
                    const maxJugadores = partida.maxJugadores
                    const puedeUnirse = jugadoresActuales < maxJugadores
                    
                    return (
                      <tr key={partida.id}>
                        <td>{partida.nombre}</td>
                        <td>{partida.galaxia}</td>
                        <td>{jugadoresActuales} / {maxJugadores}</td>
                        <td>{partida.duracion} min</td>
                        <td className={puedeUnirse ? 'status-open' : 'status-closed'}>
                          {puedeUnirse ? 'Abierta' : 'Llena'}
                        </td>
                        <td>
                          <button 
                            className={`gc-btn ${puedeUnirse ? 'gc-btn-primary' : 'gc-btn-ghost'} gc-btn-small`}
                            disabled={!puedeUnirse || uniendose === partida.id}
                            onClick={() => handleUnirse(partida)}
                          >
                            {uniendose === partida.id ? 'Uniéndose...' : (puedeUnirse ? 'Unirse' : 'Llena')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button className="gc-btn gc-btn-ghost" onClick={onClose}>Volver al Menú</button>
      </section>
    </div>
  )
}
