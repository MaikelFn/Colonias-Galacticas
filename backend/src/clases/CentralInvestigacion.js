const Construccion = require('./Construccion');
const Recursos = require('./Recursos');
const config = require('./Configuracion');

class CentralInvestigacion extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.CentralInvestigacion');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('CentralInvestigacion', costos, 'Permite investigación y producción adicional');
    }

    producir(sistema, jugador) {
        const produccionData = config.get('produccionConstrucciones.CentralInvestigacion');
        return new Recursos(produccionData.minerales, produccionData.energia, produccionData.cristales);
    }
}

module.exports = CentralInvestigacion;