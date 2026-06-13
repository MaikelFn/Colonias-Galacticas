const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

/**
 * Clase base que representa una construcción en el juego.
 * Define las propiedades y métodos comunes para todos los tipos de construcciones.
 * @class
 */
class Construccion {
    /**
     * Inicializa las propiedades de la construcción.
     * @param {string} nombre - Nombre de la construcción.
     * @param {Recursos} costo - Costo de recursos para construir.
     * @param {string} descripcion - Descripción de la construcción.
     */
    constructor(nombre, costo, descripcion = '') {
        /**
         * Nombre de la construcción.
         * @type {string}
         */
        this.nombre = nombre;

        /**
         * Costo de recursos para construir.
         * @type {Recursos}
         */
        this.costo = costo;

        /**
         * Descripción de la construcción.
         * @type {string}
         */
        this.descripcion = descripcion;
    }

    /**
     * Obtiene los costos de construcción desde la configuración.
     * @param {string} nombreClase - Nombre de la clase de construcción.
     * @returns {Recursos} Objeto Recursos con los costos de minerales, energía y cristales.
     * @static
     */
    static obtenerCostosDesdeConfig(nombreClase) {
        const costosData = config.get(`costosConstrucciones.${nombreClase}`);
        return new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
    }

    /**
     * Produce recursos para el sistema y jugador.
     * @param {SistemaPlanetario} sistema - Sistema planetario donde se encuentra la construcción.
     * @param {Jugador} jugador - Jugador propietario de la construcción.
     * @returns {Recursos} Recursos producidos (por defecto cero).
     */
    producir(sistema, jugador) {
        return new Recursos(0, 0, 0);
    }

    /**
     * Obtiene el poder de defensa de la construcción.
     * @returns {number} Poder de defensa (por defecto 0).
     */
    getPoderDefensa() {
        return 0;
    }

    /**
     * Obtiene el poder de ataque de la construcción.
     * @returns {number} Poder de ataque (por defecto 0).
     */
    getPoderAtaque() {
        return 0;
    }

    /**
     * Convierte la construcción a formato JSON.
     * @returns {Object} Objeto JSON con nombre, costo y descripción.
     */
    toJSON() {
        return {
            nombre: this.nombre,
            costo: this.costo.toJSON(),
            descripcion: this.descripcion
        };
    }
}

module.exports = Construccion;