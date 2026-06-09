const Mina = require('../Construcciones/Mina');
const CentralInvestigacion = require('../Construcciones/CentralInvestigacion');
const Fortaleza = require('../Construcciones/Fortaleza');
const Astillero = require('../Construcciones/Astillero');

class GestorConstruccion {
    constructor(partida) {
        this.partida = partida;
    }

    construir(datosConstruccion, socketId) {
        const { nombreConstruccion, idSistema } = datosConstruccion;

        const jugador = this.partida.obtenerJugadorPorSocketId(socketId);
        if (!jugador) {
            return { success: false, error: "Jugador no encontrado en la partida." };
        }

        const sistemaPlanetario = this.partida.galaxia.obtenerSistemaPorId(idSistema);
        if (!sistemaPlanetario) {
            return { success: false, error: "Sistema no encontrado." };
        }

        if (sistemaPlanetario.propietario !== jugador) {
            return { success: false, error: "No eres el propietario de este sistema." };
        }

        const nuevaConstruccion = this.crearConstruccion(nombreConstruccion, jugador, sistemaPlanetario);
        if (!nuevaConstruccion) {
            return { success: false, error: "Tipo de construcción no válido." };
        }

        if (!this.verificarRecursos(jugador, nuevaConstruccion)) {
            return { 
                success: false, 
                error: "Recursos insuficientes.",
                costo: nuevaConstruccion.costo.toJSON(),
                recursosActuales: jugador.recursos.toJSON()
            };
        }

        jugador.restarRecursos(nuevaConstruccion.costo);

        if (nombreConstruccion === 'Astillero') {
            sistemaPlanetario.agregarAstillero(nuevaConstruccion);
        } else {
            sistemaPlanetario.agregarInstalacion(nuevaConstruccion);
        }

        return {
            success: true,
            mensaje: `${nombreConstruccion} construida exitosamente en ${sistemaPlanetario.nombre}.`,
            construccion: nuevaConstruccion.toJSON(),
            sistema: sistemaPlanetario.id,
            recursosRestantes: jugador.recursos.toJSON(),
            jugador,
            sistema: sistemaPlanetario
        };
    }

    crearConstruccion(nombreConstruccion, jugador, sistemaPlanetario) {
        switch (nombreConstruccion) {
            case 'Mina':
                return new Mina();
            case 'CentralInvestigacion':
                return new CentralInvestigacion();
            case 'Fortaleza':
                return new Fortaleza();
            case 'Astillero':
                return new Astillero(`astillero_${Date.now()}`, jugador, sistemaPlanetario);
            default:
                return null;
        }
    }

    verificarRecursos(jugador, construccion) {
        return jugador.recursos.suficiente(construccion.costo);
    }
}

module.exports = GestorConstruccion;
