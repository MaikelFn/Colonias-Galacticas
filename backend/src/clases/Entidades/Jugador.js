const Recursos = require('./Recursos');
const config = require('../Configuración/Configuracion');

class Jugador {
    constructor(nickname, socketId = null) {
        this.nickname = nickname;
        this.socketId = socketId;
        this.recursos = new Recursos(0, 0, 0);
        this.partida = null;
        this.planetaBase = null;
    }

    setRecursosIniciales(dificultad) {
        const recursosIniciales = config.get('juego.recursosIniciales');
        const inicial = recursosIniciales[dificultad];
        this.recursos = new Recursos(inicial.minerales, inicial.energia, inicial.cristales);
    }

    agregarRecursos(recursos) {
        this.recursos = this.recursos.agregar(recursos);
    }

    restarRecursos(recursos) {
        this.recursos = this.recursos.restar(recursos);
    }

    getSistemasControlados() {
        if (!this.partida || !this.partida.galaxia) return [];
        return this.partida.galaxia.sistemas.filter(sistema => sistema.propietario === this);
    }

    contarInstalaciones(tipoNombre) {
        let total = 0;
        for (const sistema of this.getSistemasControlados()) {
            total += sistema.instalaciones.filter(inst => inst.nombre === tipoNombre).length;
        }
        return total;
    }

    getFlotasTotales() {
        return this.contarInstalaciones('Astillero');
    }

    obtenerEstadisticas() {
        const sistemas = this.getSistemasControlados();
        return {
            nombre: this.nickname,
            sistemasConquistados: this.contarSistemasConquistados(sistemas),
            recursos: this.recursos.toJSON(),
            flotasEnPie: this.getFlotasTotales(),
            minasEnPie: this.contarInstalaciones('Mina'),
            centrosEnPie: this.contarInstalaciones('CentralInvestigacion'),
            fortalezasEnPie: this.contarInstalaciones('Fortaleza')
        };
    }

    contarSistemasConquistados(sistemas) {
        return sistemas.length;
    }
}

module.exports = Jugador;