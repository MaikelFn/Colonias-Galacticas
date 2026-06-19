// Módulo de validaciones comunes para serve.js

/**
 * Valida que una partida exista
 * @param {Object} partida - Objeto Partida a validar
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si la partida existe, false en caso contrario
 */
function validarPartidaExiste(partida, socket, eventoError) {
    if (!partida) {
        socket.emit(eventoError, { mensaje: "Sector no detectado en los registros galácticos." });
        return false;
    }
    return true;
}

/**
 * Valida que un jugador esté en una partida
 * @param {Object} partida - Objeto Partida
 * @param {string} socketId - ID del socket del jugador
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {Object|null} Objeto Jugador si existe, null en caso contrario
 */
function validarJugadorEnPartida(partida, socketId, socket, eventoError) {
    const jugador = partida.jugadores.find(jugador => jugador.socketId === socketId);
    if (!jugador) {
        socket.emit(eventoError, { mensaje: "Comandante no detectado en este sector." });
        return null;
    }
    return jugador;
}

/**
 * Valida que un sistema estelar exista
 * @param {Object} sistema - Objeto Sistema a validar
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si el sistema existe, false en caso contrario
 */
function validarSistemaExiste(sistema, socket, eventoError) {
    if (!sistema) {
        socket.emit(eventoError, { mensaje: "Sistema estelar no encontrado en las coordenadas especificadas." });
        return false;
    }
    return true;
}

/**
 * Valida que un jugador sea el propietario de un sistema
 * @param {Object} sistema - Objeto Sistema
 * @param {Object} jugador - Objeto Jugador
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si el jugador es el propietario, false en caso contrario
 */
function validarPropietarioSistema(sistema, jugador, socket, eventoError) {
    if (sistema.propietario !== jugador) {
        socket.emit(eventoError, { mensaje: "Este sistema está bajo control de otro imperio." });
        return false;
    }
    return true;
}

/**
 * Valida que haya flotas suficientes disponibles
 * @param {number} flotasDisponibles - Cantidad de flotas disponibles
 * @param {number} cantidad - Cantidad requerida
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si hay flotas suficientes, false en caso contrario
 */
function validarFlotasSuficientes(flotasDisponibles, cantidad, socket, eventoError) {
    if (cantidad > flotasDisponibles) {
        socket.emit(eventoError, { mensaje: `Flotas insuficientes para la misión. Disponibles: ${flotasDisponibles}` });
        return false;
    }
    return true;
}

/**
 * Valida que una partida esté en un estado específico
 * @param {Object} partida - Objeto Partida
 * @param {string} estadoEsperado - Estado esperado ('esperando' o 'iniciada')
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si la partida está en el estado esperado, false en caso contrario
 */
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

/**
 * Valida que una partida no esté llena
 * @param {Object} partida - Objeto Partida
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si la partida no está llena, false en caso contrario
 */
function validarPartidaNoLlena(partida, socket, eventoError) {
    if (partida.jugadores.length >= partida.maxJugadores) {
        socket.emit(eventoError, { mensaje: "Capacidad máxima del sector alcanzada." });
        return false;
    }
    return true;
}

/**
 * Valida que el nombre de un jugador sea único en la partida
 * @param {Object} partida - Objeto Partida
 * @param {string} nombreJugador - Nombre del jugador a validar
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si el nombre es único, false en caso contrario
 */
function validarNombreJugadorUnico(partida, nombreJugador, socket, eventoError) {
    const nombreDuplicado = partida.jugadores.some(jugador => jugador.nickname === nombreJugador);
    if (nombreDuplicado) {
        socket.emit(eventoError, { mensaje: "Un comandante con ese nombre ya opera en este sector." });
        return false;
    }
    return true;
}

/**
 * Valida que un jugador esté registrado en el sistema
 * @param {Map} jugadores - Map de jugadores registrados
 * @param {string} socketId - ID del socket del jugador
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {Object|null} Objeto Jugador si está registrado, null en caso contrario
 */
function validarJugadorRegistrado(jugadores, socketId, socket, eventoError) {
    const jugador = jugadores.get(socketId);
    if (!jugador) {
        socket.emit(eventoError, { mensaje: "Comandante no registrado en la red galáctica." });
        return null;
    }
    return jugador;
}

/**
 * Valida que el nombre de una partida sea único
 * @param {Map} partidas - Map de partidas existentes
 * @param {string} nombre - Nombre de la partida a validar
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si el nombre es único, false en caso contrario
 */
function validarNombrePartidaUnico(partidas, nombre, socket, eventoError) {
    const nombreDuplicado = Array.from(partidas.values()).some(partida => partida.nombre === nombre);
    if (nombreDuplicado) {
        socket.emit(eventoError, { mensaje: "Un sector con ese nombre ya existe en la galaxia. Elige otro designación." });
        return false;
    }
    return true;
}

/**
 * Valida que una galaxia se haya cargado correctamente
 * @param {Object} galaxia - Objeto Galaxia a validar
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si la galaxia está cargada, false en caso contrario
 */
function validarGalaxiaCargada(galaxia, socket, eventoError) {
    if (!galaxia) {
        socket.emit(eventoError, { mensaje: "No se pudieron cargar los datos de la galaxia seleccionada." });
        return false;
    }
    return true;
}

/**
 * Valida que una partida tenga el mínimo de jugadores requerido
 * @param {Object} partida - Objeto Partida
 * @param {Object} socket - Socket del cliente
 * @param {string} eventoError - Nombre del evento de error a emitir
 * @returns {boolean} True si hay jugadores suficientes, false en caso contrario
 */
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
