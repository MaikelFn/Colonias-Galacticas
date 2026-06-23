// Módulo de funciones helper para serve.js

/**
 * Crea información resumida de los jugadores
 * @param {Array} jugadores - Array de objetos Jugador
 * @returns {Array} Array con información de jugadores (id, nombre, recursos, sistemas conquistados)
 */
function crearInfoJugadores(jugadores) {
    return jugadores.map(jugador => ({
        id: jugador.socketId,
        nombre: jugador.nickname,
        recursos: jugador.recursos,
        sistemasConquistados: jugador.getSistemasControlados().length
    }));
}

/**
 * Crea información resumida de la galaxia
 * @param {Object} galaxia - Objeto Galaxia
 * @returns {Object} Objeto con nombre, sistemas y rutas de la galaxia
 */
function crearInfoGalaxia(galaxia) {
    return {
        nombre: galaxia.nombre,
        sistemas: galaxia.sistemas.map(sistema => sistema.toJSON()),
        rutas: galaxia.rutas.map(ruta => [ruta.origen.id, ruta.destino.id])
    };
}

/**
 * Envía actualización del estado del juego a todos los clientes conectados
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} partida - Objeto Partida
 */
function enviarActualizacionClientes(io, partida) {
    const jugadoresInfo = crearInfoJugadores(partida.jugadores);
    partida.jugadores.forEach(jugador => {
        if (jugador.socketId) {
            io.to(jugador.socketId).emit("actualizar_clientes", {
                jugadores: jugadoresInfo,
                galaxia: crearInfoGalaxia(partida.galaxia)
            });
        }
    });
}

/**
 * Crea información resumida de una partida
 * @param {Object} partida - Objeto Partida
 * @param {number} duracion - Duración en minutos (opcional)
 * @returns {Object} Objeto con información de la partida
 */
function crearInfoPartida(partida, duracion) {
    return {
        id: partida.id,
        nombre: partida.nombre,
        galaxia: partida.galaxia.nombre,
        maxJugadores: partida.maxJugadores,
        minJugadores: partida.minJugadores,
        duracion: duracion || Math.floor(partida.duracionMaximaSeg / 60),
        recursos: partida.dificultadRecursos,
        jugadores: partida.jugadores.map(jugador => ({ id: jugador.socketId, nombre: jugador.nickname }))
    };
}

/**
 * Crea información de jugadores para partida iniciada
 * @param {Object} partida - Objeto Partida
 * @returns {Array} Array con información de jugadores incluyendo planeta base
 */
function crearInfoJugadoresIniciada(partida) {
    return partida.jugadores.map(jugador => ({
        id: jugador.socketId,
        nombre: jugador.nickname,
        planetaBase: jugador.planetaBase ? jugador.planetaBase.nombre : null,
        recursos: jugador.recursos,
        sistemasConquistados: jugador.getSistemasControlados().length
    }));
}

/**
 * Crea información de galaxia para partida iniciada
 * @param {Object} partida - Objeto Partida
 * @returns {Object} Objeto con sistemas y rutas de la galaxia
 */
function crearInfoGalaxiaIniciada(partida) {
    return {
        nombre: partida.galaxia.nombre,
        sistemas: partida.galaxia.sistemas,
        rutas: partida.galaxia.rutas.map(ruta => [ruta.origen.id, ruta.destino.id])
    };
}

/**
 * Limpia el intervalo del timer de una partida
 * @param {Object} partida - Objeto Partida
 */
function limpiarTimerPartida(partida) {
    if (partida.timerInterval) {
        clearInterval(partida.timerInterval);
        partida.timerInterval = null;
    }
}

/**
 * Crea información completa de una partida iniciada
 * @param {Object} partida - Objeto Partida
 * @returns {Object} Objeto con información de jugadores y galaxia de partida iniciada
 */
function crearInfoPartidaIniciada(partida) {
    return {
        jugadores: crearInfoJugadoresIniciada(partida),
        galaxia: crearInfoGalaxiaIniciada(partida)
    };
}

module.exports = {
    crearInfoJugadores,
    crearInfoGalaxia,
    enviarActualizacionClientes,
    crearInfoPartida,
    crearInfoJugadoresIniciada,
    crearInfoGalaxiaIniciada,
    crearInfoPartidaIniciada,
    limpiarTimerPartida
};
