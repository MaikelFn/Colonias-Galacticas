# Documentación: Conexión Backend-Frontend y Sistema de Eventos

## 📡 Arquitectura de Conexión Backend-Frontend

### 1. Servicio Socket (`src/services/socket.js`)

Este es el punto de entrada para la comunicación en tiempo real con el servidor.

```javascript
import { io } from "socket.io-client";

const socket = io("https://colonias-galacticas.onrender.com", {
  transports: ["websocket", "polling"]
});

export default socket;
```

**Características:**
- Usa **Socket.io** para comunicación en tiempo real
- Conecta al servidor: `https://colonias-galacticas.onrender.com`
- Transportes: WebSocket (primario) y polling (fallback)
- Es una instancia singleton compartida por toda la aplicación

---

### 2. Hook useSocket (`src/hooks/useSocket.js`)

Hook personalizado que gestiona la conexión WebSocket y proporciona métodos para comunicarse con el servidor.

**Métodos proporcionados:**

| Método | Descripción | Uso |
|--------|-------------|-----|
| `emit(event, data)` | Envía un evento al servidor | `emit('crear_partida', { nombre: 'Mi Partida' })` |
| `on(event, callback)` | Escucha un evento del servidor | `on('partida_creada', (data) => {...})` |
| `off(event, callback)` | Deja de escuchar un evento | `off('partida_creada', callback)` |
| `socket` | Instancia del socket.io | Acceso directo al socket |
| `isConnected` | Estado de conexión | `true` si está conectado |

**Implementación clave:**

```javascript
const on = useCallback((event, callback) => {
  socketRef.current.on(event, callback)
  return () => socketRef.current.off(event, callback)  // ← Retorna función de limpieza
}, [])
```

El método `on()` retorna una función que, cuando se ejecuta, elimina el event listener. Esta es la base del sistema `unsub`.

---

## 🔌 ¿Qué es `unsub`?

`unsub` es la abreviatura de **"unsubscribe"** (desuscribirse). Es una función que se usa para limpiar los event listeners cuando un componente se desmonta.

### ¿Por qué se llama `unsub`?

- **unsub** = abreviatura de "unsubscribe"
- Es más corto y rápido de escribir que "unsubscribe"
- Es una convención común en JavaScript/React para manejar limpieza de eventos

### Convenciones de nombres similares:

| Abreviatura | Significado | Ejemplo |
|-------------|-------------|---------|
| `sub` | subscribe | `const sub = on('evento', callback)` |
| `unsub` | unsubscribe | `const unsub = on('evento', callback)` |
| `unsubscribe` | unsubscribe (completo) | `const unsubscribe = on('evento', callback)` |
| `cb` | callback | `function miFuncion(cb) { cb() }` |
| `props` | properties | `function MiComponente(props) {}` |
| `ctx` | context | `const ctx = useContext()` |

---

## 📍 Lugares donde se usa `unsub`

### 1. **VerPartidasModal.jsx** (3 listeners)

```javascript
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
```

**Eventos escuchados:**
- `partidas_disponibles`: Lista de partidas disponibles
- `partida_unida`: Confirmación de unión a partida
- `error_unirse`: Error al intentar unirse

---

### 2. **CrearPartidaModal.jsx** (2 listeners)

```javascript
useEffect(() => {
  emit('obtener_galaxias')
  const unsub = on('galaxias_disponibles', (data) => {
    setGalaxiasDisponibles(data)
    setCargandoGalaxias(false)
    if (!galaxia && data.length > 0) {
      setGalaxia(data[0].id)
    }
  })
  return unsub
}, [emit, on, galaxia, setGalaxia])

useEffect(() => {
  emit('obtener_configuracion')
  const unsub = on('configuracion_recursos', (data) => {
    setRecursosConfig(data)
    setCargandoRecursos(false)
    if (!recursos && Object.keys(data).length > 0) {
      const primeraOpcion = Object.keys(data)[0]
      setRecursos(primeraOpcion)
    }
  })
  return unsub
}, [emit, on, recursos, setRecursos])
```

**Eventos escuchados:**
- `galaxias_disponibles`: Lista de galaxias disponibles
- `configuracion_recursos`: Configuración de recursos iniciales

---

### 3. **HomePage.jsx** (2 listeners)

```javascript
useEffect(() => {
  const unsub = on('partida_creada', (partida) => {
    setActiveModal(null)
    onEntrarLobby(partida, usuario)
  })
  return unsub
}, [on, usuario, onEntrarLobby])

useEffect(() => {
  const unsub = on('error_crear_partida', (data) => {
    addToastRef.current('Error al crear partida', data.mensaje, 'peligro')
  })
  return unsub
}, [on])
```

**Eventos escuchados:**
- `partida_creada`: Confirmación de creación de partida
- `error_crear_partida`: Error al crear partida

---

### 4. **LobbyPage.jsx** (8 listeners)

```javascript
useEffect(() => {
  const unsub = on('jugador_unido', (data) => {
    setPartidaActual(prev => {
      if (prev.jugadores.some(j => j.id === data.jugador.id)) return prev
      return { ...prev, jugadores: [...prev.jugadores, data.jugador] }
    })
    setMensajes(prev => [...prev, {
      nombreJugador: 'Sistema',
      mensaje: `${data.jugador.nombre} se ha unido a la sala.`,
      isSystem: true
    }])
  })
  return unsub
}, [on])

useEffect(() => {
  const unsub = on('jugador_salio', (data) => {
    setPartidaActual(prev => ({
      ...prev,
      jugadores: prev.jugadores.filter(j => j.id !== data.jugadorId)
    }))
    setMensajes(prev => [...prev, {
      nombreJugador: 'Sistema',
      mensaje: 'Un comandante ha abandonado la sala.',
      isSystem: true
    }])
  })
  return unsub
}, [on])

useEffect(() => {
  const unsub = on('cuenta_regresiva', (data) => {
    if (data.idPartida === partidaActual?.id) {
      setCuentaRegresiva(data.cuenta)
      if (data.cuenta === 0) {
        setTimeout(() => onIniciarJuego(partidaActual), 500)
      }
    }
  })
  return unsub
}, [on, partidaActual?.id, onIniciarJuego, partidaActual])

useEffect(() => {
  const unsub = on('partida_cerrada', (data) => {
    if (data.idPartida === partidaActual?.id) {
      setPartidaCerrada(data.razon)
      setTimeout(() => onSalir(), 2000)
    }
  })
  return unsub
}, [on, partidaActual?.id, onSalir])

useEffect(() => {
  const unsub = on('temporizador_espera', (data) => {
    if (data.idPartida === partidaActual?.id) {
      setTiempoEspera(data.segundosRestantes)
    }
  })
  return unsub
}, [on, partidaActual?.id])

useEffect(() => {
  const unsub = on('chat_mensaje', (data) => {
    setMensajes(prev => {
      const existe = prev.some(m => m.idLocal === data.idLocal)
      if (existe) return prev
      return [...prev, data]
    })
  })
  return unsub
}, [on, partidaActual?.id])

useEffect(() => {
  const unsub = on('partida_iniciada', (data) => {
    console.log('[LobbyPage] partida_iniciada recibida:', data)
    const partida = partidaActualRef.current
    const idRecibido = data.idPartida
    if (idRecibido && idRecibido !== partida?.id) {
      console.warn('ID no coincide:', idRecibido, partida?.id)
      return
    }
    const partidaActualizada = {
      ...partida,
      estado: data.estado,
      galaxia: data.galaxia,
      jugadores: data.jugadores.map(j => ({
        id: j.id,
        nombre: j.nombre,
        recursos: j.recursos,
        sistemasConquistados: j.sistemasConquistados,
        planetaBase: j.planetaBase,
      })),
    }
    onIniciarJuegoRef.current(partidaActualizada)
  })
  return unsub
}, [on])

useEffect(() => {
  const unsub = on('error_inicio', (data) => {
    if (window.showAlert) {
      window.showAlert(data.mensaje)
    }
  })
  return unsub
}, [on])
```

**Eventos escuchados:**
- `jugador_unido`: Un jugador se unió al lobby
- `jugador_salio`: Un jugador salió del lobby
- `cuenta_regresiva`: Cuenta regresiva para iniciar partida
- `partida_cerrada`: La partida fue cerrada
- `temporizador_espera`: Tiempo restante antes de cerrar partida
- `chat_mensaje`: Mensaje del chat
- `partida_iniciada`: La partida fue iniciada
- `error_inicio`: Error al iniciar partida

---

### 5. **RankingModal.jsx** (1 listener)

```javascript
useEffect(() => {
  emit('obtener_ranking')
  setCargando(true)

  const unsubscribe = on('ranking_disponible', (data) => {
    setRankings(data)
    setCargando(false)
  })

  return unsubscribe
}, [emit, on])
```

**Eventos escuchados:**
- `ranking_disponible`: Datos del ranking histórico

**Nota:** Este archivo usa el nombre completo `unsubscribe` en lugar de `unsub`.

---

## 🔄 Flujo Completo de Comunicación

### 1. **Frontend → Backend (emit)**

```javascript
// Ejemplo: Crear una partida
emit('crear_partida', {
  nombre: 'Mi Partida',
  galaxiaId: 'orion',
  maxJugadores: 4,
  duracion: 45,
  recursos: 'Normal',
  comandante: 'Jugador1'
})
```

El frontend envía un evento al servidor con los datos necesarios.

### 2. **Backend procesa y responde**

El servidor (Node.js + Socket.io) recibe el evento, lo procesa y emite una respuesta.

### 3. **Backend → Frontend (on)**

```javascript
// Frontend escucha la respuesta
const unsub = on('partida_creada', (partida) => {
  console.log('Partida creada:', partida)
  // Navegar al lobby
  onEntrarLobby(partida, usuario)
})
```

El frontend recibe la respuesta y ejecuta el callback.

### 4. **Limpieza (unsub)**

```javascript
// Cuando el componente se desmonta
return unsub  // Ejecuta: () => socket.off('partida_creada', callback)
```

Se elimina el event listener para evitar memory leaks.

---

## 🎯 Resumen de Eventos del Sistema

### Eventos EMITIDOS por el Frontend:

| Evento | Datos | Archivo |
|--------|-------|---------|
| `obtener_partidas` | - | VerPartidasModal |
| `unirse_partida` | `{ idPartida, nombreJugador }` | VerPartidasModal |
| `obtener_galaxias` | - | CrearPartidaModal |
| `obtener_configuracion` | - | CrearPartidaModal |
| `crear_partida` | `{ nombre, galaxiaId, galaxia, maxJugadores, duracion, recursos, comandante }` | CrearPartidaModal |
| `registrar_jugador` | `{ nombre }` | HomePage |
| `obtener_ranking` | - | RankingModal |
| `iniciar_partida` | `{ idPartida }` | LobbyPage |
| `salir_sala` | `{ idPartida }` | LobbyPage |
| `chat_mensaje` | `{ idPartida, nombreJugador, mensaje, idLocal }` | LobbyPage |

### Eventos RECIBIDOS por el Frontend:

| Evento | Datos | Archivo |
|--------|-------|---------|
| `partidas_disponibles` | `Array<Partida>` | VerPartidasModal |
| `partida_unida` | `Partida` | VerPartidasModal |
| `error_unirse` | `{ mensaje }` | VerPartidasModal |
| `galaxias_disponibles` | `Array<Galaxia>` | CrearPartidaModal |
| `configuracion_recursos` | `Object` | CrearPartidaModal |
| `partida_creada` | `Partida` | HomePage |
| `error_crear_partida` | `{ mensaje }` | HomePage |
| `jugador_unido` | `{ jugador }` | LobbyPage |
| `jugador_salio` | `{ jugadorId }` | LobbyPage |
| `cuenta_regresiva` | `{ idPartida, cuenta }` | LobbyPage |
| `partida_cerrada` | `{ idPartida, razon }` | LobbyPage |
| `temporizador_espera` | `{ idPartida, segundosRestantes }` | LobbyPage |
| `chat_mensaje` | `{ nombreJugador, mensaje, ts, idLocal }` | LobbyPage |
| `partida_iniciada` | `{ idPartida, estado, galaxia, jugadores }` | LobbyPage |
| `error_inicio` | `{ mensaje }` | LobbyPage |
| `ranking_disponible` | `Array<Ranking>` | RankingModal |

---

## ⚠️ Importancia del Sistema `unsub`

### Sin `unsub` (Problemas):

1. **Memory Leaks:** Los event listeners siguen activos después de que el componente se desmonta
2. **Errores de Estado:** El código intenta actualizar el estado de componentes que ya no existen
3. **Rendimiento:** Acumulación de listeners innecesarios que consumen memoria
4. **Comportamiento Inesperado:** Eventos se ejecutan en componentes incorrectos

### Con `unsub` (Soluciones):

1. **Limpieza Automática:** React ejecuta `return unsub` al desmontar el componente
2. **Prevención de Errores:** No se intentan actualizar estados inexistentes
3. **Rendimiento Óptimo:** Solo los listeners necesarios están activos
4. **Código Robusto:** La aplicación maneja correctamente el ciclo de vida de componentes

---

## 📚 Patrones de Uso

### Patrón 1: Listener Único

```javascript
useEffect(() => {
  emit('obtener_datos')
  const unsub = on('datos_recibidos', (data) => {
    setDatos(data)
  })
  return unsub
}, [emit, on])
```

### Patrón 2: Múltiples Listeners

```javascript
useEffect(() => {
  const unsub1 = on('evento1', callback1)
  const unsub2 = on('evento2', callback2)
  const unsub3 = on('evento3', callback3)
  return () => { unsub1(); unsub2(); unsub3() }
}, [on])
```

### Patrón 3: Listener con Filtro

```javascript
useEffect(() => {
  const unsub = on('evento_global', (data) => {
    if (data.idPartida === partidaActual?.id) {
      // Procesar solo si es para esta partida
      setEstado(data.estado)
    }
  })
  return unsub
}, [on, partidaActual?.id])
```

---

## 🔧 Archivos que Usan el Sistema

| Archivo | Listeners | Nombre de variable |
|---------|-----------|-------------------|
| `VerPartidasModal.jsx` | 3 | `unsub1`, `unsub2`, `unsub3` |
| `CrearPartidaModal.jsx` | 2 | `unsub` |
| `HomePage.jsx` | 2 | `unsub` |
| `LobbyPage.jsx` | 8 | `unsub` |
| `RankingModal.jsx` | 1 | `unsubscribe` |

---

## 📝 Conclusión

El sistema de conexión backend-frontend en Colonias Galácticas se basa en:

1. **Socket.io** para comunicación en tiempo real
2. **useSocket hook** para gestionar la conexión
3. **emit()** para enviar eventos al servidor
4. **on()** para escuchar eventos del servidor
5. **unsub** para limpiar listeners y prevenir memory leaks

Este patrón asegura una comunicación eficiente, robusta y sin memory leaks en toda la aplicación.
