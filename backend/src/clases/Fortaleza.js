const Construccion = require('./Construccion');
const Recursos = require('./Recursos');
const config = require('./Configuracion');

class Fortaleza extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.Fortaleza');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Fortaleza', costos, 'Defensa avanzada');
    }

    getPoderDefensa() {
        const poder = config.get('poderCombate.Fortaleza');
        return poder.defensa;
    }
}

module.exports = Fortaleza;