// Módulo de validaciones comunes para serve.js

function validarPartidaExiste(partida, socket, eventoError) {
    if (!partida) {
        socket.emit(eventoError, { mensaje: "Sector no detectado en los registros galácticos." });
        return false;
    }
    return true;
}

function validarJugadorEnPartida(partida, socketId, socket, eventoError) {
    const jugador = partida.jugadores.find(jugador => jugador.socketId === socketId);
    if (!jugador) {
        socket.emit(eventoError, { mensaje: "Comandante no detectado en este sector." });
        return null;
    }
    return jugador;
}

function validarSistemaExiste(sistema, socket, eventoError) {
    if (!sistema) {
        socket.emit(eventoError, { mensaje: "Sistema estelar no encontrado en las coordenadas especificadas." });
        return false;
    }
    return true;
}

function validarPropietarioSistema(sistema, jugador, socket, eventoError) {
    if (sistema.propietario !== jugador) {
        socket.emit(eventoError, { mensaje: "Este sistema está bajo control de otro imperio." });
        return false;
    }
    return true;
}

function validarFlotasSuficientes(flotasDisponibles, cantidad, socket, eventoError) {
    if (cantidad > flotasDisponibles) {
        socket.emit(eventoError, { mensaje: `Flotas insuficientes para la misión. Disponibles: ${flotasDisponibles}` });
        return false;
    }
    return true;
}

function validarEstadoPartida(partida, estadoEsperado, socket, eventoError) {
    if (partida.estado !== estadoEsperado) {
        const mensajes = {
            'esperando': 'Este sector ya no acepta nuevas inscripciones.',
            'iniciada': 'Las hostilidades ya han comenzado en este sector.'
        };
        socket.emit(eventoError, { mensaje: mensajes[estadoEsperado] || 'Estado del sector desconocido.' });
        return false;
    }
    return true;
}

function validarPartidaNoLlena(partida, socket, eventoError) {
    if (partida.jugadores.length >= partida.maxJugadores) {
        socket.emit(eventoError, { mensaje: "Capacidad máxima del sector alcanzada." });
        return false;
    }
    return true;
}

function validarNombreJugadorUnico(partida, nombreJugador, socket, eventoError) {
    const nombreDuplicado = partida.jugadores.some(jugador => jugador.nickname === nombreJugador);
    if (nombreDuplicado) {
        socket.emit(eventoError, { mensaje: "Un comandante con ese nombre ya opera en este sector." });
        return false;
    }
    return true;
}

function validarJugadorRegistrado(jugadores, socketId, socket, eventoError) {
    const jugador = jugadores.get(socketId);
    if (!jugador) {
        socket.emit(eventoError, { mensaje: "Comandante no registrado en la red galáctica." });
        return null;
    }
    return jugador;
}

function validarNombrePartidaUnico(partidas, nombre, socket, eventoError) {
    const nombreDuplicado = Array.from(partidas.values()).some(partida => partida.nombre === nombre);
    if (nombreDuplicado) {
        socket.emit(eventoError, { mensaje: "Un sector con ese nombre ya existe en la galaxia. Elige otro designación." });
        return false;
    }
    return true;
}

function validarGalaxiaCargada(galaxia, socket, eventoError) {
    if (!galaxia) {
        socket.emit(eventoError, { mensaje: "No se pudieron cargar los datos de la galaxia seleccionada." });
        return false;
    }
    return true;
}

function validarJugadoresMinimos(partida, socket, eventoError) {
    if (partida.jugadores.length < partida.minJugadores) {
        socket.emit(eventoError, { mensaje: `Se requieren al menos ${partida.minJugadores} comandantes para iniciar las hostilidades.` });
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
