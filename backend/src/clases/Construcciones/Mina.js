const Construccion = require('./Construccion');

class Mina extends Construccion {
    constructor() {
        const costos = Construccion.obtenerCostosDesdeConfig('Mina');
        super('Mina', costos, 'Estructura defensiva. Cada 3 minas suman 1 punto de defensa');
    }
}

module.exports = Mina;