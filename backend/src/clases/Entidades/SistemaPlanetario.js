const Recursos = require('./Recursos');
const config = require('../Configuración/Configuracion');

class SistemaPlanetario {
    constructor(id, nombre, tipo) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.propietario = null;
        this.astillerosEstacionados = [];
        this.instalaciones = [];
        this.estado = 'no explorado';
        this.totalProducido = new Recursos(0, 0, 0);
    }

    obtenerProduccionBase() {
        const produccionPlanetas = config.get('produccionPlanetas');
        const tipoLower = this.tipo.toLowerCase();
        return produccionPlanetas[tipoLower];
    }

    obtenerProduccionTotal() {
        const base = this.obtenerProduccionBase();
        let total = new Recursos(base.minerales, base.energia, base.cristales);
        
        const centrales = this.instalaciones.filter(inst => inst.nombre === 'CentralInvestigacion');
        for (const central of centrales) {
            const prod = central.producir(this, this.propietario);
            total = total.agregar(prod);
        }
        
        return total;
    }

    esControlable() {
        return this.estado === 'no explorado';
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
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            tipo: this.tipo,
            propietario: this.propietario ? this.propietario.nickname : null,
            astillerosEstacionados: this.astillerosEstacionados.length,
            astilleros: this.astillerosEstacionados.map(astillero => astillero.toJSON()),
            instalaciones: this.instalaciones.map(instalacion => instalacion.toJSON()),
            estado: this.estado,
            produccion: this.obtenerProduccionTotal().toJSON(),
            totalProducido: this.totalProducido.toJSON()
        };
    }
}

module.exports = SistemaPlanetario;