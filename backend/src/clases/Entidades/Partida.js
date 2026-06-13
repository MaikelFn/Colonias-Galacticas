const config = require('../Configuración/Configuracion');
const GestorTemporizadores = require('../Gestores/GestorTemporizadores');
const GestorProduccion = require('../Gestores/GestorProduccion');

/**
 * Estados posibles de una partida.
 * @enum {string}
 */
const EstadoPartida = {
    ESPERANDO: 'esperando',
    INICIADA: 'iniciada',
    FINALIZADA: 'finalizada'
};

/**
 * Representa una partida del juego con múltiples jugadores.
 * Gestiona el ciclo de vida de la partida, la producción de recursos y las condiciones de victoria.
 * @class
 */
class Partida {
    /**
     * Inicializa las propiedades de la partida.
     * @param {string} id - Identificador único de la partida.
     * @param {string} nombre - Nombre de la partida.
     * @param {Galaxia} galaxia - Galaxia donde se desarrolla la partida.
     * @param {number} maxJugadores - Máximo número de jugadores permitidos.
     * @param {number} duracionMaximaSeg - Duración máxima de la partida en segundos.
     * @param {string} dificultadRecursos - Dificultad de recursos ('facil', 'normal', 'dificil').
     * @param {number|null} tiempoEsperaSeg - Tiempo de espera para iniciar la partida en segundos.
     * @param {Function} onCierrePorTiempo - Callback cuando la partida se cierra por tiempo de espera.
     * @param {Function} onProduccionRecursos - Callback cuando se producen recursos.
     * @param {Object} io - Instancia de Socket.IO para comunicación.
     * @param {Function} onFinPartida - Callback cuando finaliza la partida.
     * @param {Function} onDestruirPartida - Callback cuando se destruye la partida.
     */
    constructor(id, nombre, galaxia, maxJugadores, duracionMaximaSeg, dificultadRecursos, tiempoEsperaSeg = null, onCierrePorTiempo, onProduccionRecursos, io, onFinPartida, onDestruirPartida) {
        /**
         * Identificador único de la partida.
         * @type {string}
         */
        this.id = id;

        /**
         * Nombre de la partida.
         * @type {string}
         */
        this.nombre = nombre;

        /**
         * Galaxia donde se desarrolla la partida.
         * @type {Galaxia}
         */
        this.galaxia = galaxia;

        /**
         * Máximo número de jugadores permitidos.
         * @type {number}
         */
        this.maxJugadores = maxJugadores;

        /**
         * Duración máxima de la partida en segundos.
         * @type {number}
         */
        this.duracionMaximaSeg = duracionMaximaSeg;

        /**
         * Dificultad de recursos.
         * @type {string}
         */
        this.dificultadRecursos = dificultadRecursos;

        /**
         * Tiempo de espera para iniciar la partida en segundos.
         * @type {number}
         */
        this.tiempoEsperaSeg = tiempoEsperaSeg !== null ? tiempoEsperaSeg : config.get('juego.tiempoEsperaPartidaSeg');

        /**
         * Mínimo número de jugadores para iniciar.
         * @type {number}
         */
        this.minJugadores = config.get('juego.minimoJugadoresPartida');

        /**
         * Lista de jugadores en la partida.
         * @type {Jugador[]}
         */
        this.jugadores = [];

        /**
         * Estado actual de la partida.
         * @type {string}
         */
        this.estado = EstadoPartida.ESPERANDO;

        /**
         * Fecha de creación de la partida.
         * @type {number}
         */
        this.fechaCreacion = Date.now();

        /**
         * Fecha de inicio de la partida.
         * @type {number|null}
         */
        this.fechaInicio = null;

        /**
         * Fecha de finalización de la partida.
         * @type {number|null}
         */
        this.fechaFin = null;

        /**
         * Gestor de temporizadores de la partida.
         * @type {GestorTemporizadores}
         */
        this.gestorTemporizadores = new GestorTemporizadores();

        /**
         * Gestor de producción de recursos.
         * @type {GestorProduccion}
         */
        this.gestorProduccion = new GestorProduccion(this.gestorTemporizadores, this.galaxia, this, onProduccionRecursos);

        /**
         * Indica si la cuenta regresiva está activa.
         * @type {boolean}
         */
        this.cuentaRegresivaActiva = false;

        /**
         * Callback cuando la partida se cierra por tiempo de espera.
         * @type {Function}
         */
        this.onCierrePorTiempo = onCierrePorTiempo;

        /**
         * Instancia de Socket.IO para comunicación.
         * @type {Object}
         */
        this.io = io;

        /**
         * Callback cuando finaliza la partida.
         * @type {Function}
         */
        this.onFinPartida = onFinPartida;

        /**
         * Callback cuando se destruye la partida.
         * @type {Function}
         */
        this.onDestruirPartida = onDestruirPartida;
    }

    /**
     * Verifica si la partida puede iniciarse.
     * @returns {boolean} Retorna true si la partida está en estado esperando y tiene suficientes jugadores.
     */
    puedeIniciar() {
        return this.estado === EstadoPartida.ESPERANDO && this.jugadores.length >= this.minJugadores;
    }

    /**
     * Inicia la cuenta regresiva para comenzar la partida.
     * @returns {boolean} Retorna true si se inició la cuenta regresiva correctamente.
     */
    iniciarCuentaRegresiva() {
        if (!this.puedeIniciar() || this.cuentaRegresivaActiva) return false;
        this.cuentaRegresivaActiva = true;
        setTimeout(() => {
            this.iniciar();
        }, 3000);
        return true;
    }

    /**
     * Inicia la partida.
     * @returns {boolean} Retorna true si se inició la partida correctamente.
     */
    iniciar() {
        if (this.estado !== EstadoPartida.ESPERANDO) return false;
        this.estado = EstadoPartida.INICIADA;
        this.fechaInicio = Date.now();
        this.asignarPlanetasBase();
        this.iniciarProduccion();
        if (this.duracionMaximaSeg > 0) {
            this.gestorTemporizadores.iniciarTemporizadorDuracion(this.duracionMaximaSeg, () => {
                this.finalizarPorTiempo();
            });
        }
        return true;
    }

    /**
     * Asigna planetas base a cada jugador.
     */
    asignarPlanetasBase() {
        const sistemasLibres = this.galaxia.sistemas.filter(sistema => sistema.propietario === null);
        for (let indice = 0; indice < this.jugadores.length && indice < sistemasLibres.length; indice++) {
            const sistema = sistemasLibres[indice];
            const jugador = this.jugadores[indice];
            sistema.propietario = jugador;
            sistema.estado = 'controlado';
            jugador.planetaBase = sistema;
            jugador.setRecursosIniciales(this.dificultadRecursos);
        }
    }

    /**
     * Inicia la producción de recursos.
     */
    iniciarProduccion() {
        this.gestorProduccion.iniciarProduccion();
    }

    /**
     * Produce recursos para todos los jugadores.
     */
    producirRecursos() {
        this.gestorProduccion.producirRecursos();
    }

    /**
     * Emite el evento de fin de partida a todos los jugadores.
     * @param {string} razon - Razón de la finalización.
     * @param {Jugador|null} jugadorGanador - Jugador ganador (si aplica).
     */
    emitirFinPartida(razon, jugadorGanador = null) {
        if (!this.io) return;

        const ranking = this.obtenerRanking();
        const ganador = jugadorGanador ? jugadorGanador.nickname : (ranking[0]?.nombre ?? null)

        this.io.to(this.id).emit('partida_finalizada', {
            idPartida: this.id,
            razon,
            ganador,
            ranking,
            tiempoJuego: Math.floor((this.fechaFin - this.fechaInicio) / 1000),
            galaxia: this.galaxia.nombre
        });

        // Guardar en ranking histórico
        if (this.onFinPartida && ganador) {
            this.onFinPartida({
                idPartida: this.id,
                ganador,
                ranking,
                galaxia: this.galaxia.nombre,
                tiempoJuego: Math.floor((this.fechaFin - this.fechaInicio) / 1000)
            })
        }
    }

    /**
     * Finaliza la partida por tiempo límite.
     */
    finalizarPorTiempo() {
        if (this.estado !== EstadoPartida.INICIADA) return;
        this.estado = EstadoPartida.FINALIZADA;
        this.fechaFin = Date.now();
        this.calcularPuntajes();
        this.detenerTemporizadores();
        this.emitirFinPartida('tiempo');
        if (this.onDestruirPartida) {
            this.onDestruirPartida(this.id);
        }
    }

    /**
     * Finaliza la partida por conquista de sistemas.
     * @param {Jugador} jugadorGanador - Jugador que conquistó suficientes sistemas.
     */
    finalizarPorConquista(jugadorGanador) {
        if (this.estado !== EstadoPartida.INICIADA) return;
        this.estado = EstadoPartida.FINALIZADA;
        this.fechaFin = Date.now();
        this.calcularPuntajes();
        this.detenerTemporizadores();
        this.emitirFinPartida('conquista', jugadorGanador);
        if (this.onDestruirPartida) {
            this.onDestruirPartida(this.id);
        }
    }

    /**
     * Verifica si la partida debe finalizar por eliminación de jugadores.
     */
    finalizarPorEliminacion() {
        if (this.jugadores.length === 1) {
            const jugadorRestante = this.jugadores[0];
            this.finalizarPorAbandono(jugadorRestante);
            return;
        }

        const jugadoresActivos = this.jugadores.filter(jugador =>
            this.galaxia.sistemas.some(sistema => sistema.propietario === jugador)
        );
        if (jugadoresActivos.length === 1) {
            this.finalizarPorConquista(jugadoresActivos[0]);
        }
    }

    /**
     * Finaliza la partida por abandono de los demás jugadores.
     * @param {Jugador} jugadorRestante - Único jugador restante.
     */
    finalizarPorAbandono(jugadorRestante) {
        if (this.estado !== EstadoPartida.INICIADA) return;
        this.estado = EstadoPartida.FINALIZADA;
        this.fechaFin = Date.now();
        this.detenerTemporizadores();
        
        if (!this.io) return;

        this.io.to(this.id).emit('partida_cerrada', {
            idPartida: this.id,
            razon: 'Todos los demás jugadores abandonaron la partida',
            mensaje: 'La partida se cerró porque todos los demás jugadores abandonaron'
        });

        if (this.onDestruirPartida) {
            this.onDestruirPartida(this.id);
        }
    }

    /**
     * Verifica si algún jugador ha ganado por conquista de sistemas.
     */
    chequearVictoriaPorConquista() {
        if (this.estado !== EstadoPartida.INICIADA) return;
        const totalSistemas = this.galaxia.sistemas.length;
        const porcentaje = config.get('juego.porcentajeSistemasParaGanar');
        const umbral = Math.ceil(totalSistemas * porcentaje);

        for (const jugador of this.jugadores) {
            const controlados = this.galaxia.sistemas.filter(sistema => sistema.propietario === jugador).length;
            if (controlados >= umbral) {
                this.finalizarPorConquista(jugador);
                return;
            }
        }

        this.finalizarPorEliminacion();
    }

    /**
     * Calcula los puntajes finales de todos los jugadores.
     */
    calcularPuntajes() {
        for (const jugador of this.jugadores) {
            jugador.puntajeFinal = this.calcularPuntajeJugador(jugador);
        }
        this.ordenarJugadoresPorPuntaje();
    }

    /**
     * Calcula el puntaje de un jugador.
     * @param {Jugador} jugador - Jugador a evaluar.
     * @returns {number} Puntaje total del jugador.
     */
    calcularPuntajeJugador(jugador) {
        const puntajeSistemas = this.calcularPuntajeSistemas(jugador);
        const puntajeRecursos = this.calcularPuntajeRecursos(jugador);
        const puntajeInfraestructura = this.calcularPuntajeInfraestructura(jugador);
        return puntajeSistemas + puntajeRecursos + puntajeInfraestructura;
    }

    /**
     * Calcula el puntaje por sistemas controlados.
     * @param {Jugador} jugador - Jugador a evaluar.
     * @returns {number} Puntaje por sistemas.
     */
    calcularPuntajeSistemas(jugador) {
        const sistemasControlados = this.galaxia.sistemas.filter(sistema => sistema.propietario === jugador).length;
        return sistemasControlados * 5000;
    }

    /**
     * Calcula el puntaje por recursos acumulados.
     * @param {Jugador} jugador - Jugador a evaluar.
     * @returns {number} Puntaje por recursos.
     */
    calcularPuntajeRecursos(jugador) {
        const recursos = jugador.recursos;
        return recursos.minerales * 1 + recursos.energia * 2 + recursos.cristales * 3;
    }

    /**
     * Calcula el puntaje por infraestructura construida.
     * @param {Jugador} jugador - Jugador a evaluar.
     * @returns {number} Puntaje por infraestructura.
     */
    calcularPuntajeInfraestructura(jugador) {
        const fortalezas = jugador.contarInstalaciones('Fortaleza');
        const centros = jugador.contarInstalaciones('CentralInvestigacion');
        return fortalezas * 100 + centros * 150;
    }

    /**
     * Ordena los jugadores por puntaje descendente.
     */
    ordenarJugadoresPorPuntaje() {
        this.jugadores.sort((a, b) => b.puntajeFinal - a.puntajeFinal);
    }

    /**
     * Detiene todos los temporizadores de la partida.
     */
    detenerTemporizadores() {
        this.gestorProduccion.detenerProduccion();
        this.gestorTemporizadores.detenerTodos();
    }

    /**
     * Agrega un jugador a la partida.
     * @param {Jugador} jugador - Jugador a agregar.
     * @returns {boolean} Retorna true si se agregó correctamente.
     */
    agregarJugador(jugador) {
        if (this.estado !== EstadoPartida.ESPERANDO) return false;
        if (this.jugadores.length >= this.maxJugadores) return false;
        this.jugadores.push(jugador);
        jugador.partida = this;
        if (!this.gestorTemporizadores.temporizadorEspera && this.jugadores.length < this.maxJugadores) {
            this.gestorTemporizadores.iniciarTemporizadorEspera(this.tiempoEsperaSeg, () => {
                if (this.estado === EstadoPartida.ESPERANDO) {
                    this.estado = EstadoPartida.FINALIZADA;
                    this.detenerTemporizadores();
                    if (this.onCierrePorTiempo) {
                        this.onCierrePorTiempo(this);
                    }
                }
            });
        }
        return true;
    }

    /**
     * Obtiene un jugador por su ID de socket.
     * @param {string} socketId - ID del socket a buscar.
     * @returns {Jugador|undefined} Jugador encontrado o undefined.
     */
    obtenerJugadorPorSocketId(socketId) {
        return this.jugadores.find(jugador => jugador.socketId === socketId);
    }

    /**
     * Obtiene la información pública de la partida.
     * @returns {Object} Objeto con la información de la partida.
     */
    obtenerInformacion() {
        return {
            id: this.id,
            nombre: this.nombre,
            galaxia: this.galaxia.nombre,
            jugadoresActuales: this.jugadores.length,
            maxJugadores: this.maxJugadores,
            estado: this.estado
        };
    }

    /**
     * Obtiene el ranking de jugadores de la partida.
     * @returns {Object[]} Array con el ranking de jugadores.
     */
    obtenerRanking() {
        return this.jugadores.map((jugador, indice) => {
            const estadisticas = jugador.obtenerEstadisticas();
            return {
                posicion: indice + 1,
                puntaje: jugador.puntajeFinal,
                nombre: jugador.nickname,
                ...estadisticas
            };
        });
    }
}

module.exports = { Partida, EstadoPartida };