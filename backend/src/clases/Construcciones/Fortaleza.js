const Construccion = require('./Construccion');
const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

class Fortaleza extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.Fortaleza');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Fortaleza', costos, 'Defensa avanzada');
    }

    getPoderDefensa() {
        return 2;
    }
}

module.exports = Fortaleza;