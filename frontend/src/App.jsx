import { useState } from 'react'
import HomePage from './pages/HomePage/HomePage'
import LobbyPage from './pages/LobbyPage/LobbyPage'
import GamePage from './pages/GamePage/GamePage'
import AlertContainer from './components/Alert/Alert'
import './App.css'

function App() {
  const [pantalla, setPantalla] = useState('home')
  const [partida, setPartida] = useState(null)
  const [nombreJugador, setNombreJugador] = useState('')

  const irALobby = (partidaData, nombre) => {
    setPartida(partidaData)
    setNombreJugador(nombre)
    setPantalla('lobby')
  }

  const irAJuego = (partidaData) => {
    setPartida(partidaData)
    setPantalla('game')
  }

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