const Construccion = require('./Construccion');

/**
 * Representa una fortaleza, una estructura defensiva avanzada.
 * Extiende de la clase Construccion.
 * @class
 * @extends Construccion
 */
class Fortaleza extends Construccion {
    /**
     * Inicializa las propiedades de la fortaleza.
     */
    constructor() {
        const costos = Construccion.obtenerCostosDesdeConfig('Fortaleza');
        super('Fortaleza', costos, 'Defensa avanzada');
    }

    /**
     * Obtiene el poder de defensa de la fortaleza.
     * @returns {number} Poder de defensa de la fortaleza (2).
     */
    getPoderDefensa() {
        return 2;
    }
}

module.exports = Fortaleza;