const Construccion = require('./Construccion');

/**
 * Representa una mina, una estructura defensiva que contribuye a la defensa.
 * Cada 3 minas suman 1 punto de defensa.
 * Extiende de la clase Construccion.
 * @class
 * @extends Construccion
 */
class Mina extends Construccion {
    /**
     * Inicializa las propiedades de la mina.
     */
    constructor() {
        const costos = Construccion.obtenerCostosDesdeConfig('Mina');
        super('Mina', costos, 'Estructura defensiva. Cada 3 minas suman 1 punto de defensa');
    }
}

module.exports = Mina;