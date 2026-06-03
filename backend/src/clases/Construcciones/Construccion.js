const Recursos = require('../Entidades/Recursos');

class Construccion {
    constructor(nombre, costo, descripcion = '') {
        this.nombre = nombre;
        this.costo = costo;
        this.descripcion = descripcion;
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