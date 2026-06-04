const Construccion = require('./Construccion');
const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

class Mina extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.Mina');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Mina', costos, 'Estructura defensiva. Cada 3 minas suman 1 punto de defensa');
    }
}

module.exports = Mina;