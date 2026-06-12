const Construccion = require('./Construccion');

class Astillero extends Construccion {
    constructor(id, propietario, sistemaOrigen) {
        const costos = Construccion.obtenerCostosDesdeConfig('Astillero');
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
            propietario: this.propietario.nickname,
            sistemaActual: this.sistemaActual.nombre,
            costo: this.costo.toJSON()
        };
    }
}

module.exports = Astillero;