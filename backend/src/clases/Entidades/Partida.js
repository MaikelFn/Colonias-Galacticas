const config = require('../Configuración/Configuracion');
const GestorTemporizadores = require('../Gestores/GestorTemporizadores');
const GestorProduccion = require('../Gestores/GestorProduccion');

const EstadoPartida = {
    ESPERANDO: 'esperando',
    INICIADA: 'iniciada',
    FINALIZADA: 'finalizada'
};

class Partida {
    constructor(id, nombre, galaxia, maxJugadores, duracionMaximaSeg, dificultadRecursos, tiempoEsperaSeg = null, onCierrePorTiempo, onProduccionRecursos, io, onFinPartida, onDestruirPartida) {
        this.id = id;
        this.nombre = nombre;
        this.galaxia = galaxia;
        this.maxJugadores = maxJugadores;
        this.duracionMaximaSeg = duracionMaximaSeg;
        this.dificultadRecursos = dificultadRecursos;
        this.tiempoEsperaSeg = tiempoEsperaSeg !== null ? tiempoEsperaSeg : config.get('juego.tiempoEsperaPartidaSeg');
        this.minJugadores = config.get('juego.minimoJugadoresPartida');
        this.jugadores = [];
        this.estado = EstadoPartida.ESPERANDO;
        this.fechaCreacion = Date.now();
        this.fechaInicio = null;
        this.fechaFin = null;
        this.gestorTemporizadores = new GestorTemporizadores();
        this.gestorProduccion = new GestorProduccion(this.gestorTemporizadores, this.galaxia, this, onProduccionRecursos);
        this.cuentaRegresivaActiva = false;
        this.onCierrePorTiempo = onCierrePorTiempo;
        this.io = io;
        this.onFinPartida = onFinPartida;
        this.onDestruirPartida = onDestruirPartida;
    }

    puedeIniciar() {
        return this.estado === EstadoPartida.ESPERANDO && this.jugadores.length >= this.minJugadores;
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
        this.gestorProduccion.iniciarProduccion();
    }

    producirRecursos() {
        this.gestorProduccion.producirRecursos();
    }

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

    finalizarPorEliminacion() {
        if (this.jugadores.length === 1) {
            const jugadorRestante = this.jugadores[0];
            const tieneSistemas = this.galaxia.sistemas.some(sistema => sistema.propietario === jugadorRestante);
            
            if (tieneSistemas) {
                this.finalizarPorConquista(jugadorRestante);
            } else {
                this.finalizarPorAbandono(jugadorRestante);
            }
            return;
        }

        const jugadoresActivos = this.jugadores.filter(jugador =>
            this.galaxia.sistemas.some(sistema => sistema.propietario === jugador)
        );
        if (jugadoresActivos.length === 1) {
            this.finalizarPorConquista(jugadoresActivos[0]);
        }
    }

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

    chequearVictoriaPorConquista() {
        if (this.estado !== EstadoPartida.INICIADA) return;
        const totalSistemas = this.galaxia.sistemas.length;
        const porcentaje = config.get('juego.porcentajeSistemasParaGanar');
        const umbral = Math.ceil(totalSistemas * porcentaje);

        for (const jugador of this.jugadores) {
            const controlados = this.galaxia.sistemas.filter(s => s.propietario === jugador).length;
            if (controlados >= umbral) {
                this.finalizarPorConquista(jugador);
                return;
            }
        }

        this.finalizarPorEliminacion();
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
        this.gestorProduccion.detenerProduccion();
        this.gestorTemporizadores.detenerTemporizadorEspera();
    }

    agregarJugador(jugador) {
        if (this.estado !== EstadoPartida.ESPERANDO) return false;
        if (this.jugadores.length >= this.maxJugadores) return false;
        this.jugadores.push(jugador);
        jugador.partida = this;
        if (!this.gestorTemporizadores.temporizadorEspera && this.jugadores.length < this.maxJugadores) {
            this.gestorTemporizadores.iniciarTemporizadorEspera(this.tiempoEsperaSeg, () => {
                if (this.estado === EstadoPartida.ESPERANDO && this.jugadores.length < this.minJugadores) {
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

    obtenerJugadorPorSocketId(socketId) {
        return this.jugadores.find(jugador => jugador.socketId === socketId);
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