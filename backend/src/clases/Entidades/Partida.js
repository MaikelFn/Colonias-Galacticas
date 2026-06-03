const config = require('../Configuración/Configuracion');
const GestorTemporizadores = require('../Gestores/GestorTemporizadores');

const EstadoPartida = {
    ESPERANDO: 'esperando',
    INICIADA: 'iniciada',
    FINALIZADA: 'finalizada'
};

class Partida {
    constructor(id, nombre, galaxia, maxJugadores, duracionMaximaSeg, dificultadRecursos, tiempoEsperaSeg = null) {
        this.id = id;
        this.nombre = nombre;
        this.galaxia = galaxia;
        this.maxJugadores = maxJugadores;
        this.duracionMaximaSeg = duracionMaximaSeg;
        this.dificultadRecursos = dificultadRecursos;
        this.tiempoEsperaSeg = tiempoEsperaSeg !== null ? tiempoEsperaSeg : config.get('juego.tiempoEsperaPartidaSeg');
        this.jugadores = [];
        this.estado = EstadoPartida.ESPERANDO;
        this.fechaCreacion = Date.now();
        this.fechaInicio = null;
        this.fechaFin = null;
        this.gestorTemporizadores = new GestorTemporizadores();
        this.cuentaRegresivaActiva = false;
    }

    puedeIniciar() {
        return this.estado === EstadoPartida.ESPERANDO && this.jugadores.length >= 2;
    }

    iniciarCuentaRegresiva() {
        if (!this.puedeIniciar() || this.cuentaRegresivaActiva) return false;
        this.cuentaRegresivaActiva = true;
        setTimeout(() => {
            this.iniciar();
        }, 3000);
        return true;
    }

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

    iniciarProduccion() {
        const cicloProduccion = config.get('juego.cicloProduccionSeg');
        this.gestorTemporizadores.iniciarIntervaloProduccion(cicloProduccion, () => {
            this.producirRecursos();
        });
    }

    producirRecursos() {
        if (this.estado !== EstadoPartida.INICIADA) return;
        for (const sistema of this.galaxia.sistemas) {
            if (sistema.propietario && sistema.estado === 'controlado') {
                const produccion = sistema.obtenerProduccionTotal();
                sistema.propietario.agregarRecursos(produccion);
            }
        }
    }

    finalizarPorTiempo() {
        if (this.estado !== EstadoPartida.INICIADA) return;
        this.estado = EstadoPartida.FINALIZADA;
        this.fechaFin = Date.now();
        this.calcularPuntajes();
        this.detenerTemporizadores();
    }

    finalizarPorConquista(jugadorGanador) {
        if (this.estado !== EstadoPartida.INICIADA) return;
        this.estado = EstadoPartida.FINALIZADA;
        this.fechaFin = Date.now();
        this.calcularPuntajes();
        this.detenerTemporizadores();
    }

    finalizarPorEliminacion() {
        const jugadoresActivos = this.jugadores.filter(jugador => this.galaxia.sistemas.some(sistema => sistema.propietario === jugador));
        if (jugadoresActivos.length === 1) {
            this.finalizarPorConquista(jugadoresActivos[0]);
        }
    }

    calcularPuntajes() {
        for (const jugador of this.jugadores) {
            jugador.puntajeFinal = this.calcularPuntajeJugador(jugador);
        }
        this.ordenarJugadoresPorPuntaje();
    }

    calcularPuntajeJugador(jugador) {
        const puntajeSistemas = this.calcularPuntajeSistemas(jugador);
        const puntajeRecursos = this.calcularPuntajeRecursos(jugador);
        const puntajeInfraestructura = this.calcularPuntajeInfraestructura(jugador);
        return puntajeSistemas + puntajeRecursos + puntajeInfraestructura;
    }

    calcularPuntajeSistemas(jugador) {
        const sistemasControlados = this.galaxia.sistemas.filter(sistema => sistema.propietario === jugador).length;
        return sistemasControlados * 5000;
    }

    calcularPuntajeRecursos(jugador) {
        const recursos = jugador.recursos;
        return recursos.minerales * 1 + recursos.energia * 2 + recursos.cristales * 3;
    }

    calcularPuntajeInfraestructura(jugador) {
        const fortalezas = jugador.contarInstalaciones('Fortaleza');
        const centros = jugador.contarInstalaciones('CentralInvestigacion');
        return fortalezas * 100 + centros * 150;
    }

    ordenarJugadoresPorPuntaje() {
        this.jugadores.sort((a, b) => b.puntajeFinal - a.puntajeFinal);
    }

    detenerTemporizadores() {
        this.gestorTemporizadores.detenerTodos();
    }

    agregarJugador(jugador) {
        if (this.estado !== EstadoPartida.ESPERANDO) return false;
        if (this.jugadores.length >= this.maxJugadores) return false;
        this.jugadores.push(jugador);
        jugador.partida = this;
        if (!this.gestorTemporizadores.temporizadorEspera && this.jugadores.length < this.maxJugadores) {
            this.gestorTemporizadores.iniciarTemporizadorEspera(this.tiempoEsperaSeg, () => {
                if (this.estado === EstadoPartida.ESPERANDO && this.jugadores.length < 2) {
                    this.estado = EstadoPartida.FINALIZADA;
                    this.detenerTemporizadores();
                }
            });
        }
        return true;
    }

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

    obtenerRanking() {
        return this.jugadores.map((jugador, indice) => ({
            posicion: indice + 1,
            puntaje: jugador.puntajeFinal,
            nombre: jugador.nickname,
            ...jugador.obtenerEstadisticas()
        }));
    }
}

module.exports = { Partida, EstadoPartida };