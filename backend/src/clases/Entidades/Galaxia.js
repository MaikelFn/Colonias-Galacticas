const SistemaPlanetario = require('./SistemaPlanetario');
const Ruta = require('./Ruta');

class Galaxia {
    constructor(nombre) {
        this.nombre = nombre;
        this.sistemas = [];
        this.rutas = [];
    }

    cargarDesdeJSON(json) {
        this.nombre = json.nombre;
        this.sistemas = [];
        this.rutas = [];
        this.cargarSistemasDesdeJSON(json.sistemas);
        this.cargarRutasDesdeJSON(json.rutas);
    }

    cargarSistemasDesdeJSON(sistemasData) {
        for (const sys of sistemasData) {
            const sistema = new SistemaPlanetario(sys.id, sys.nombre, sys.tipo, sys.descripcion || '');
            this.sistemas.push(sistema);
        }
    }

    cargarRutasDesdeJSON(rutasData) {
        for (const ruta of rutasData) {
            const origen = this.obtenerSistemaPorId(ruta[0]);
            const destino = this.obtenerSistemaPorId(ruta[1]);
            if (origen && destino) {
                this.rutas.push(new Ruta(origen, destino));
            }
        }
    }

    obtenerSistemaPorId(id) {
        return this.sistemas.find(s => s.id === id);
    }

    obtenerVecinos(sistema) {
        const vecinos = [];
        for (const ruta of this.rutas) {
            const otro = ruta.obtenerOtro(sistema);
            if (otro) {
                vecinos.push(otro);
            }
        }
        return vecinos;
    }

    obtenerRutaEntre(origen, destino) {
        return this.rutas.find(r => r.conecta(origen, destino));
    }

    sistemasControladosPor(jugador) {
        return this.sistemas.filter(s => s.propietario === jugador && s.estado === 'controlado');
    }

    toJSON() {
        return {
            nombre: this.nombre,
            sistemas: this.sistemas.map(s => s.toJSON()),
            rutas: this.rutas.map(r => r.toJSON())
        };
    }
}

module.exports = Galaxia;