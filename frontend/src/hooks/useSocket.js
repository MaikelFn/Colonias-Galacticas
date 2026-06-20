import { useEffect, useRef, useCallback } from 'react'
import socket from '../services/socket'

/**
 * Hook personalizado para gestionar la conexión WebSocket.
 * Proporciona métodos para emitir y escuchar eventos del socket.
 * 
 * @returns {Object} Objeto con el socket y métodos de comunicación.
 * @returns {Object} returns.socket - Instancia del socket.io.
 * @returns {Function} returns.emit - Función para emitir eventos al servidor.
 * @returns {Function} returns.on - Función para escuchar eventos del servidor.
 * @returns {Function} returns.off - Función para dejar de escuchar eventos.
 * @returns {boolean} returns.isConnected - Estado de conexión actual.
 */
export function useSocket() {
  const socketRef = useRef(socket)

  useEffect(() => {
    // Conexión inicial
    if (!socketRef.current.connected) {
      socketRef.current.connect()
    }

    socketRef.current.on('connect', () => {
      console.log('Conectado al servidor:', socketRef.current.id)
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Error de conexión:', error)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Desconectado del servidor')
    })

    return () => {
      // No desconectar al desmontar el componente
    }
  }, [])

  /**
   * Emite un evento al servidor WebSocket.
   * @param {string} event - Nombre del evento a emitir.
   * @param {*} data - Datos a enviar con el evento.
   */
  const emit = useCallback((event, data) => {
    socketRef.current.emit(event, data)
  }, [])

  /**
   * Escucha un evento del servidor WebSocket.
   * @param {string} event - Nombre del evento a escuchar.
   * @param {Function} callback - Función a ejecutar cuando se recibe el evento.
   * @returns {Function} Función de limpieza para dejar de escuchar el evento.
   */
  const on = useCallback((event, callback) => {
    socketRef.current.on(event, callback)
    return () => socketRef.current.off(event, callback)
  }, [])

  /**
   * Deja de escuchar un evento del servidor WebSocket.
   * @param {string} event - Nombre del evento a dejar de escuchar.
   * @param {Function} callback - Función a remover del evento.
   */
  const off = useCallback((event, callback) => {
    socketRef.current.off(event, callback)
  }, [])

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected: socketRef.current.connected
  }
}
