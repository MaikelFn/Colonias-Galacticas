const Construccion = require('./Construccion');
const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

class CentralInvestigacion extends Construccion {
    constructor() {
        const costos = Construccion.obtenerCostosDesdeConfig('CentralInvestigacion');
        super('CentralInvestigacion', costos, 'Produce recursos automáticamente cada ciclo');
    }

    producir(sistema, jugador) {
        const produccionData = config.get('produccionConstrucciones.CentralInvestigacion');
        return new Recursos(produccionData.minerales, produccionData.energia, produccionData.cristales);
    }

    getPoderDefensa() {
        return 0;
    }
}

module.exports = CentralInvestigacion;