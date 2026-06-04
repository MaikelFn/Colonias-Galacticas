const Construccion = require('./Construccion');
const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

class Mina extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.Mina');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Mina', costos, 'Estructura defensiva. Un stillero puede neutralizar 3 minas');
    }

    getPoderDefensa() {
        return 0;
    }
}

module.exports = Mina;