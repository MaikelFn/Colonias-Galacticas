const Recursos = require('./Recursos');
const config = require('../Configuración/Configuracion');

class SistemaPlanetario {
    constructor(id, nombre, tipo, descripcion = '') {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.propietario = null;
        this.flotasEstacionadas = 0;
        this.instalaciones = [];
        this.estado = 'no explorado';
    }

    obtenerProduccionBase() {
        const produccionPlanetas = config.get('produccionPlanetas');
        return produccionPlanetas[this.tipo];
    }

    obtenerProduccionTotal() {
        const base = this.obtenerProduccionBase();
        let total = new Recursos(base.minerales, base.energia, base.cristales);
        for (const inst of this.instalaciones) {
            if (typeof inst.producir === 'function') {
                const prod = inst.producir(this, this.propietario);
                total = total.agregar(prod);
            }
        }
        return total;
    }

    esControlable() {
        return this.estado === 'no explorado' && this.flotasEstacionadas === 0;
    }

    setPropietario(jugador) {
        this.propietario = jugador;
        this.estado = 'controlado';
    }

    liberar() {
        this.propietario = null;
        this.estado = 'no explorado';
        this.flotasEstacionadas = 0;
    }

    agregarInstalacion(construccion) {
        this.instalaciones.push(construccion);
    }

    removerInstalacion(indice) {
        this.instalaciones.splice(indice, 1);
    }

    agregarFlotas(cantidad) {
        this.flotasEstacionadas += cantidad;
    }

    removerFlotas(cantidad) {
        this.flotasEstacionadas = Math.max(0, this.flotasEstacionadas - cantidad);
    }

    obtenerPoderDefensa() {
        let defensa = this.flotasEstacionadas;
        for (const inst of this.instalaciones) {
            defensa += inst.getPoderDefensa ? inst.getPoderDefensa() : 0;
        }
        return defensa;
    }

    obtenerPoderAtaque() {
        let ataque = this.flotasEstacionadas;
        for (const inst of this.instalaciones) {
            ataque += inst.getPoderAtaque ? inst.getPoderAtaque() : 0;
        }
        return ataque;
    }

    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            tipo: this.tipo,
            descripcion: this.descripcion,
            propietario: this.propietario ? this.propietario.nickname : null,
            flotasEstacionadas: this.flotasEstacionadas,
            instalaciones: this.instalaciones.map(i => i.toJSON()),
            estado: this.estado,
            produccion: this.obtenerProduccionTotal().toJSON()
        };
    }
}

module.exports = SistemaPlanetario;