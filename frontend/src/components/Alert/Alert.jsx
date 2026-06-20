import { useEffect, useState } from 'react'
import './Alert.css'

/**
 * Componente que muestra una alerta individual con temporizador automático.
 * @param {Object} alert - Objeto con los datos de la alerta.
 * @param {string} alert.mensaje - Mensaje de la alerta.
 * @param {Function} onClose - Función a ejecutar al cerrar la alerta.
 * @returns {JSX.Element|null} El componente de alerta o null si no hay alerta.
 */
function Alert({ alert, onClose }) {
  if (!alert) return null

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="alert-toast">
      <div className="alert-toast-icon">⚠️</div>
      <div className="alert-toast-message">{alert.mensaje}</div>
      <button className="alert-toast-close" onClick={onClose}>✕</button>
    </div>
  )
}

/**
 * Contenedor global de alertas que gestiona múltiples alertas simultáneas.
 * Expone una función global window.showAlert para mostrar alertas desde cualquier componente.
 * 
 * @returns {JSX.Element} El contenedor de alertas.
 */
export default function AlertContainer() {
  const [alerts, setAlerts] = useState([])

  /**
   * Agrega una nueva alerta al contenedor.
   * @param {string} mensaje - Mensaje de la alerta a mostrar.
   */
  const addAlert = (mensaje) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, mensaje }])
  }

  /**
   * Remueve una alerta del contenedor por su ID.
   * @param {number} id - ID de la alerta a remover.
   */
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  // Exponer función globalmente para usar desde otros componentes
  useEffect(() => {
    window.showAlert = addAlert
    return () => {
      delete window.showAlert
    }
  }, [])

  return (
    <div className="alert-toast-container">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          alert={alert}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  )
}
