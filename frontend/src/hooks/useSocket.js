import { useEffect, useRef, useCallback } from 'react'
import socket from '../services/socket'

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

  const emit = useCallback((event, data) => {
    socketRef.current.emit(event, data)
  }, [])

  const on = useCallback((event, callback) => {
    socketRef.current.on(event, callback)
    return () => socketRef.current.off(event, callback)
  }, [])

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
