const Recursos = require('./Recursos');
const config = require('../Configuración/Configuracion');

class SistemaPlanetario {
    constructor(id, nombre, tipo, descripcion = '') {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.propietario = null;
        this.astillerosEstacionados = [];
        this.instalaciones = [];
        this.estado = 'no explorado';
    }

    obtenerProduccionBase() {
        const produccionPlanetas = config.get('produccionPlanetas');
        const tipoLower = this.tipo.toLowerCase();
        return produccionPlanetas[tipoLower];
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
        return this.estado === 'no explorado' && this.astillerosEstacionados.length === 0;
    }

    setPropietario(jugador) {
        this.propietario = jugador;
        this.estado = 'controlado';
    }

    liberar() {
        this.propietario = null;
        this.estado = 'no explorado';
        this.astillerosEstacionados = [];
    }

    agregarInstalacion(construccion) {
        this.instalaciones.push(construccion);
    }

    removerInstalacion(indice) {
        this.instalaciones.splice(indice, 1);
    }

    agregarAstillero(astillero) {
        this.astillerosEstacionados.push(astillero);
    }

    removerAstillero(astillero) {
        const indice = this.astillerosEstacionados.indexOf(astillero);
        if (indice !== -1) {
            this.astillerosEstacionados.splice(indice, 1);
        }
    }

    obtenerCantidadAstilleros() {
        return this.astillerosEstacionados.length;
    }

    obtenerPoderDefensa() {
        let defensa = this.astillerosEstacionados.length;
        for (const inst of this.instalaciones) {
            defensa += inst.getPoderDefensa ? inst.getPoderDefensa() : 0;
        }
        return defensa;
    }

    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            tipo: this.tipo,
            descripcion: this.descripcion,
            propietario: this.propietario ? this.propietario.nickname : null,
            astillerosEstacionados: this.astillerosEstacionados.length,
            astilleros: this.astillerosEstacionados.map(astillero => astillero.toJSON()),
            instalaciones: this.instalaciones.map(instalacion => instalacion.toJSON()),
            estado: this.estado,
            produccion: this.obtenerProduccionTotal().toJSON()
        };
    }
}

module.exports = SistemaPlanetario;