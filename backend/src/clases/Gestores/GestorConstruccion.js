const Mina = require('../Construcciones/Mina');
const CentralInvestigacion = require('../Construcciones/CentralInvestigacion');
const Fortaleza = require('../Construcciones/Fortaleza');
const Astillero = require('../Construcciones/Astillero');

class GestorConstruccion {
    constructor(partida) {
        this.partida = partida;
    }

    construir(datos, socketId) {
        const { nombreConstruccion, idSistema } = datos;

        const jugador = this.partida.obtenerJugadorPorSocketId(socketId);
        if (!jugador) {
            return { success: false, error: "Jugador no encontrado en la partida." };
        }

        const sistema = this.partida.galaxia.obtenerSistemaPorId(idSistema);
        if (!sistema) {
            return { success: false, error: "Sistema no encontrado." };
        }

        if (sistema.propietario !== jugador) {
            return { success: false, error: "No eres el propietario de este sistema." };
        }

        const construccion = this.crearConstruccion(nombreConstruccion, jugador, sistema);
        if (!construccion) {
            return { success: false, error: "Tipo de construcción no válido." };
        }

        if (!this.verificarRecursos(jugador, construccion)) {
            return { 
                success: false, 
                error: "Recursos insuficientes.",
                costo: construccion.costo.toJSON(),
                recursosActuales: jugador.recursos.toJSON()
            };
        }

        jugador.restarRecursos(construccion.costo);
        sistema.agregarInstalacion(construccion);

        return { 
            success: true,
            mensaje: `${nombreConstruccion} construida exitosamente en ${sistema.nombre}.`,
            construccion: construccion.toJSON(),
            sistema: sistema.id,
            recursosRestantes: jugador.recursos.toJSON(),
            jugador,
            sistema
        };
    }

    crearConstruccion(nombreConstruccion, jugador, sistema) {
        switch (nombreConstruccion) {
            case 'Mina':
                return new Mina();
            case 'CentralInvestigacion':
                return new CentralInvestigacion();
            case 'Fortaleza':
                return new Fortaleza();
            case 'Astillero':
                return new Astillero(`astillero_${Date.now()}`, jugador, sistema);
            default:
                return null;
        }
    }

    verificarRecursos(jugador, construccion) {
        return jugador.recursos.suficiente(construccion.costo);
    }
}

module.exports = GestorConstruccion;
