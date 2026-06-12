const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

class Construccion {
    constructor(nombre, costo, descripcion = '') {
        this.nombre = nombre;
        this.costo = costo;
        this.descripcion = descripcion;
    }

    static obtenerCostosDesdeConfig(nombreClase) {
        const costosData = config.get(`costosConstrucciones.${nombreClase}`);
        return new Recursos(costosData.minerales, costosData.energia, costosData.cristales);
    }

    producir(sistema, jugador) {
        return new Recursos(0, 0, 0);
    }
    getPoderDefensa() {
        return 0;
    }

    getPoderAtaque() {
        return 0;
    }
    toJSON() {
        return {
            nombre: this.nombre,
            costo: this.costo.toJSON(),
            descripcion: this.descripcion
        };
    }
}

module.exports = Construccion;