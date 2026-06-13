const Construccion = require('./Construccion');

/**
 * Representa un astillero, una unidad de combate móvil que puede moverse entre sistemas.
 * Extiende de la clase Construccion.
 * @class
 * @extends Construccion
 */
class Astillero extends Construccion {
    /**
     * Inicializa las propiedades del astillero.
     * @param {string} id - Identificador único del astillero.
     * @param {Jugador} propietario - Jugador propietario del astillero.
     * @param {SistemaPlanetario} sistemaOrigen - Sistema planetario donde se encuentra inicialmente.
     */
    constructor(id, propietario, sistemaOrigen) {
        const costos = Construccion.obtenerCostosDesdeConfig('Astillero');
        super('Astillero', costos, 'Unidad de combate móvil');
        /**
         * Identificador único del astillero.
         * @type {string}
         */
        this.id = id;

        /**
         * Jugador propietario del astillero.
         * @type {Jugador}
         */
        this.propietario = propietario;

        /**
         * Sistema planetario donde se encuentra actualmente el astillero.
         * @type {SistemaPlanetario}
         */
        this.sistemaActual = sistemaOrigen;
    }

    /**
     * Mueve el astillero a un sistema destino.
     * @param {SistemaPlanetario} sistemaDestino - Sistema planetario de destino.
     * @returns {boolean} Retorna true si el movimiento se realizó exitosamente.
     */
    mover(sistemaDestino) {
        this.sistemaActual = sistemaDestino;
        return true;
    }

    /**
     * Obtiene el poder de combate del astillero.
     * @returns {number} Poder de combate del astillero.
     */
    getPoderCombate() {
        return 1;
    }

    /**
     * Obtiene el poder de defensa del astillero.
     * @returns {number} Poder de defensa del astillero.
     */
    getPoderDefensa() {
        return 1;
    }

    /**
     * Verifica si el astillero se encuentra en un sistema específico.
     * @param {SistemaPlanetario} sistema - Sistema planetario a verificar.
     * @returns {boolean} Retorna true si el astillero está en el sistema especificado.
     */
    estaEnSistema(sistema) {
        return this.sistemaActual === sistema;
    }

    /**
     * Convierte el astillero a formato JSON.
     * @returns {Object} Objeto JSON con id, nombre, propietario, sistema actual y costo.
     */
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            propietario: this.propietario.nickname,
            sistemaActual: this.sistemaActual.nombre,
            costo: this.costo.toJSON()
        };
    }
}

module.exports = Astillero;