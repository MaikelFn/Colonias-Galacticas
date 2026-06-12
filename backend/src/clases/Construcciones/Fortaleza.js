const Construccion = require('./Construccion');

class Fortaleza extends Construccion {
    constructor() {
        const costos = Construccion.obtenerCostosDesdeConfig('Fortaleza');
        super('Fortaleza', costos, 'Defensa avanzada');
    }

    getPoderDefensa() {
        return 2;
    }
}

module.exports = Fortaleza;