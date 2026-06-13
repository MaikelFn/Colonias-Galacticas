const Recursos = require('./Recursos');
const config = require('../Configuración/Configuracion');

/**
 * Representa un jugador en el juego.
 * @class
 */
class Jugador {
    /**
     * Inicializa las propiedades del jugador.
     * @param {string} nickname - Nombre del jugador.
     * @param {string} socketId - ID del socket de conexión.
     */
    constructor(nickname, socketId ) {
        /**
         * Nombre del jugador.
         * @type {string}
         */
        this.nickname = nickname;

        /**
         * ID del socket de conexión.
         * @type {string}
         */
        this.socketId = socketId;

        /**
         * Recursos del jugador.
         * @type {Recursos}
         */
        this.recursos = new Recursos(0, 0, 0);

        /**
         * Partida en la que participa el jugador.
         * @type {Partida|null}
         */
        this.partida = null;

        /**
         * Planeta base del jugador.
         * @type {SistemaPlanetario|null}
         */
        this.planetaBase = null;
    }

    /**
     * Establece los recursos iniciales según la dificultad.
     * @param {string} dificultad - Nivel de dificultad del juego.
     */
    setRecursosIniciales(dificultad) {
        const recursosIniciales = config.get('juego.recursosIniciales');
        const dificultadKey = dificultad.toLowerCase();
        const inicial = recursosIniciales[dificultadKey];
        this.recursos = new Recursos(inicial.minerales, inicial.energia, inicial.cristales);
    }

    /**
     * Agrega recursos a los existentes del jugador.
     * @param {Recursos} recursos - Recursos a agregar.
     */
    agregarRecursos(recursos) {
        this.recursos = this.recursos.agregar(recursos);
    }

    /**
     * Resta recursos a los existentes del jugador.
     * @param {Recursos} recursos - Recursos a restar.
     */
    restarRecursos(recursos) {
        this.recursos = this.recursos.restar(recursos);
    }

    /**
     * Obtiene los sistemas planetarios controlados por el jugador.
     * @returns {SistemaPlanetario[]} Array de sistemas controlados.
     */
    getSistemasControlados() {
        if (!this.partida || !this.partida.galaxia) return [];
        return this.partida.galaxia.sistemas.filter(sistema => sistema.propietario === this);
    }

    /**
     * Cuenta las instalaciones de un tipo específico en todos los sistemas controlados.
     * @param {string} tipoNombre - Nombre del tipo de instalación.
     * @returns {number} Cantidad total de instalaciones del tipo especificado.
     */
    contarInstalaciones(tipoNombre) {
        let total = 0;
        for (const sistema of this.getSistemasControlados()) {
            total += sistema.instalaciones.filter(instalacion => instalacion.nombre === tipoNombre).length;
        }
        return total;
    }

    /**
     * Obtiene el total de astilleros en todos los sistemas controlados.
     * @returns {number} Cantidad total de astilleros.
     */
    getAstillerosTotales() {
        let total = 0;
        for (const sistema of this.getSistemasControlados()) {
            total += sistema.obtenerCantidadAstilleros();
        }
        return total;
    }

    /**
     * Obtiene las estadísticas del jugador.
     * @returns {Object} Objeto con las estadísticas del jugador.
     */
    obtenerEstadisticas() {
        const sistemas = this.getSistemasControlados();
        return {
            nombre: this.nickname,
            sistemasConquistados: this.contarSistemasConquistados(sistemas),
            recursos: this.recursos.toJSON(),
            astillerosEnPie: this.getAstillerosTotales(),
            minasEnPie: this.contarInstalaciones('Mina'),
            centrosEnPie: this.contarInstalaciones('CentralInvestigacion'),
            fortalezasEnPie: this.contarInstalaciones('Fortaleza')
        };
    }

    /**
     * Cuenta los sistemas conquistados.
     * @param {SistemaPlanetario[]} sistemas - Array de sistemas a contar.
     * @returns {number} Cantidad de sistemas conquistados.
     */
    contarSistemasConquistados(sistemas) {
        return sistemas.length;
    }
}

module.exports = Jugador;