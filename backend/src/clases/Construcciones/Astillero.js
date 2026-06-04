const Construccion = require('./Construccion');
const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

class Astillero extends Construccion {
    constructor(id, propietario, sistemaOrigen) {
        const costosData = config.get('costosConstrucciones.Astillero');
        const costos = new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
        super('Astillero', costos, 'Unidad de combate móvil');
        this.id = id;
        this.propietario = propietario;
        this.sistemaActual = sistemaOrigen;
    }

    mover(sistemaDestino) {
        this.sistemaActual = sistemaDestino;
        return true;
    }

    getPoderCombate() {
        return 1;
    }

    getPoderDefensa() {
        return 1;
    }

    estaEnSistema(sistema) {
        return this.sistemaActual === sistema;
    }

    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            propietario: this.propietario ? this.propietario.nickname : null,
            sistemaActual: this.sistemaActual ? this.sistemaActual.nombre : null,
            costo: this.costo.toJSON()
        };
    }
}

module.exports = Astillero;