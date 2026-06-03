const Construccion = require('./Construccion');
const Recursos = require('./Recursos');
const config = require('./Configuracion');

class Mina extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.Mina');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Mina', costos, 'Produce 50 minerales por ciclo');
    }

    producir(sistema, jugador) {
        const produccionData = config.get('produccionConstrucciones.Mina');
        return new Recursos(produccionData.minerales, produccionData.energia, produccionData.cristales);
    }

    getPoderDefensa() {
        return 0;
    }
}

module.exports = Mina;