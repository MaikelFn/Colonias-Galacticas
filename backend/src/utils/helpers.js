// Módulo de funciones helper para serve.js

function crearInfoJugadores(jugadores) {
    return jugadores.map(jugador => ({
        id: jugador.socketId,
        nombre: jugador.nickname,
        recursos: jugador.recursos,
        sistemasConquistados: jugador.getSistemasControlados().length
    }));
}

function crearInfoGalaxia(galaxia) {
    return {
        nombre: galaxia.nombre,
        sistemas: galaxia.sistemas.map(sistema => sistema.toJSON()),
        rutas: galaxia.rutas.map(ruta => [ruta.origen.id, ruta.destino.id])
    };
}

function enviarActualizacionClientes(io, partida, jugadoresInfo, crearInfoGalaxia) {
    partida.jugadores.forEach(jugador => {
        if (jugador.socketId) {
            io.to(jugador.socketId).emit("actualizar_clientes", {
                jugadores: jugadoresInfo,
                galaxia: crearInfoGalaxia(partida.galaxia)
            });
        }
    });
}

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

function crearInfoJugadoresIniciada(partida) {
    return partida.jugadores.map(jugador => ({
        id: jugador.socketId,
        nombre: jugador.nickname,
        planetaBase: jugador.planetaBase ? jugador.planetaBase.nombre : null,
        recursos: jugador.recursos,
        sistemasConquistados: jugador.getSistemasControlados().length
    }));
}

function crearInfoGalaxiaIniciada(partida) {
    return {
        nombre: partida.galaxia.nombre,
        sistemas: partida.galaxia.sistemas,
        rutas: partida.galaxia.rutas.map(ruta => [ruta.origen.id, ruta.destino.id])
    };
}

function limpiarTimerPartida(partida) {
    if (partida.timerInterval) {
        clearInterval(partida.timerInterval);
        partida.timerInterval = null;
    }
}

module.exports = {
    crearInfoJugadores,
    crearInfoGalaxia,
    enviarActualizacionClientes,
    crearInfoPartida,
    crearInfoJugadoresIniciada,
    crearInfoGalaxiaIniciada,
    limpiarTimerPartida
};
