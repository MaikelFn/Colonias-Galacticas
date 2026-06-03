const Construccion = require('./Construccion');
const Recursos = require('./Recursos');
const config = require('./Configuracion');

class Astillero extends Construccion {
    constructor() {
        const costosData = config.get('costosConstrucciones.Astillero');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Astillero', costos, 'Genera flotas para ataque y defensa');
        this.flotasGeneradas = 1;
    }

    getPoderAtaque() {
        const poder = config.get('poderCombate.Astillero');
        return poder.ataque;
    }

    getPoderDefensa() {
        const poder = config.get('poderCombate.Astillero');
        return poder.defensa;
    }
}

module.exports = Astillero;