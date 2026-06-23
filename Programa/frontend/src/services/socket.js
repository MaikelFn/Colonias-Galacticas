import { io } from "socket.io-client";

/**
 * Instancia del cliente Socket.io para comunicación en tiempo real con el servidor.
 * Configurada con transporte WebSocket y polling como fallback.
 * 
 * @type {import("socket.io-client").Socket}
 */
const socket = io("https://colonias-galacticas.onrender.com", {
  transports: ["websocket", "polling"]
});

export default socket;