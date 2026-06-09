import { useEffect, useState } from 'react'
import './Alert.css'

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

export default function AlertContainer() {
  const [alerts, setAlerts] = useState([])

  const addAlert = (mensaje) => {
    const id = Date.now()
    setAlerts(prev => [...prev, { id, mensaje }])
  }

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
