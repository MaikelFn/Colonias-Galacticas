// Módulo de validaciones comunes para serve.js

function validarPartidaExiste(partida, socket, eventoError) {
    if (!partida) {
        socket.emit(eventoError, { mensaje: "La partida no existe." });
        return false;
    }
    return true;
}

function validarJugadorEnPartida(partida, socketId, socket, eventoError) {
    const jugador = partida.jugadores.find(j => j.socketId === socketId);
    if (!jugador) {
        socket.emit(eventoError, { mensaje: "Jugador no encontrado en la partida." });
        return null;
    }
    return jugador;
}

function validarSistemaExiste(sistema, socket, eventoError) {
    if (!sistema) {
        socket.emit(eventoError, { mensaje: "Sistema no encontrado." });
        return false;
    }
    return true;
}

function validarPropietarioSistema(sistema, jugador, socket, eventoError) {
    if (sistema.propietario !== jugador) {
        socket.emit(eventoError, { mensaje: "No eres el propietario del sistema." });
        return false;
    }
    return true;
}

function validarFlotasSuficientes(flotasDisponibles, cantidad, socket, eventoError) {
    if (cantidad > flotasDisponibles) {
        socket.emit(eventoError, { mensaje: `No tienes suficientes flotas. Disponibles: ${flotasDisponibles}` });
        return false;
    }
    return true;
}

function validarEstadoPartida(partida, estadoEsperado, socket, eventoError) {
    if (partida.estado !== estadoEsperado) {
        const mensajes = {
            'esperando': 'La partida ya no está disponible.',
            'iniciada': 'La partida ya está iniciada.'
        };
        socket.emit(eventoError, { mensaje: mensajes[estadoEsperado] || 'Estado de partida inválido.' });
        return false;
    }
    return true;
}

function validarPartidaNoLlena(partida, socket, eventoError) {
    if (partida.jugadores.length >= partida.maxJugadores) {
        socket.emit(eventoError, { mensaje: "La partida ya está llena." });
        return false;
    }
    return true;
}

function validarNombreJugadorUnico(partida, nombreJugador, socket, eventoError) {
    const nombreDuplicado = partida.jugadores.some(jugador => jugador.nickname === nombreJugador);
    if (nombreDuplicado) {
        socket.emit(eventoError, { mensaje: "Ya existe un jugador con ese nombre en la partida." });
        return false;
    }
    return true;
}

function validarJugadorRegistrado(jugadores, socketId, socket, eventoError) {
    const jugador = jugadores.get(socketId);
    if (!jugador) {
        socket.emit(eventoError, { mensaje: "Jugador no registrado" });
        return null;
    }
    return jugador;
}

function validarNombrePartidaUnico(partidas, nombre, socket, eventoError) {
    const nombreDuplicado = Array.from(partidas.values()).some(partida => partida.nombre === nombre);
    if (nombreDuplicado) {
        socket.emit(eventoError, { mensaje: "Ya existe una partida con ese nombre. Por favor, elige otro nombre." });
        return false;
    }
    return true;
}

function validarGalaxiaCargada(galaxia, socket, eventoError) {
    if (!galaxia) {
        socket.emit(eventoError, { mensaje: "No se pudo cargar la galaxia seleccionada" });
        return false;
    }
    return true;
}

function validarJugadoresMinimos(partida, socket, eventoError) {
    if (partida.jugadores.length < partida.minJugadores) {
        socket.emit(eventoError, { mensaje: `Se necesitan al menos ${partida.minJugadores} jugadores para iniciar.` });
        return false;
    }
    return true;
}

module.exports = {
    validarPartidaExiste,
    validarJugadorEnPartida,
    validarSistemaExiste,
    validarPropietarioSistema,
    validarFlotasSuficientes,
    validarEstadoPartida,
    validarPartidaNoLlena,
    validarNombreJugadorUnico,
    validarJugadorRegistrado,
    validarNombrePartidaUnico,
    validarGalaxiaCargada,
    validarJugadoresMinimos
};
