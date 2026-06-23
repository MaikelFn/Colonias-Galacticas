import { useState } from 'react'
import HomePage from './pages/HomePage/HomePage'
import LobbyPage from './pages/LobbyPage/LobbyPage'
import GamePage from './pages/GamePage/GamePage'
import AlertContainer from './components/Alert/Alert'
import './App.css'

/**
 * Componente principal de la aplicación Colonias Galácticas.
 * Maneja la navegación entre las diferentes pantallas del juego (home, lobby, game).
 * 
 * @returns {JSX.Element} El componente principal de la aplicación.
 */
function App() {
  const [pantalla, setPantalla] = useState('home')
  const [partida, setPartida] = useState(null)
  const [nombreJugador, setNombreJugador] = useState('')

  /**
   * Navega a la pantalla del lobby.
   * @param {Object} partidaData - Datos de la partida.
   * @param {string} nombre - Nombre del jugador.
   */
  const irALobby = (partidaData, nombre) => {
    setPartida(partidaData)
    setNombreJugador(nombre)
    setPantalla('lobby')
  }

  /**
   * Navega a la pantalla del juego.
   * @param {Object} partidaData - Datos de la partida actualizada.
   */
  const irAJuego = (partidaData) => {
    setPartida(partidaData)
    setPantalla('game')
  }

  /**
   * Navega a la página principal y limpia el estado.
   */
  const irAHome = () => {
    setPartida(null)
    setNombreJugador('')
    setPantalla('home')
  }

  if (pantalla === 'lobby') {
    return (
      <>
        <LobbyPage
          partida={partida}
          nombreJugador={nombreJugador}
          onIniciarJuego={irAJuego}
          onSalir={irAHome}
        />
        <AlertContainer />
      </>
    )
  }

  if (pantalla === 'game') {
    return (
      <>
        <GamePage
          partida={partida}
          nombreJugador={nombreJugador}
          onSalir={irAHome}
        />
        <AlertContainer />
      </>
    )
  }

  return (
    <>
      <HomePage
        onEntrarLobby={irALobby}
      />
      <AlertContainer />
    </>
  )
}

export default App