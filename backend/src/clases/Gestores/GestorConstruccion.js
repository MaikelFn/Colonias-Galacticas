const Mina = require('../Construcciones/Mina');
const CentralInvestigacion = require('../Construcciones/CentralInvestigacion');
const Fortaleza = require('../Construcciones/Fortaleza');
const Astillero = require('../Construcciones/Astillero');

/**
 * Gestiona la construcción de edificios y unidades en la partida.
 * Valida recursos, propietario y crea las construcciones correspondientes.
 * @class
 */
class GestorConstruccion {
    /**
     * Inicializa el gestor de construcción.
     * @param {Partida} partida - Partida donde se construye.
     */
    constructor(partida) {
        /**
         * Partida donde se construye.
         * @type {Partida}
         */
        this.partida = partida;
    }

    /**
     * Construye una edificación o unidad en un sistema.
     * @param {Object} datosConstruccion - Datos de la construcción.
     * @param {string} datosConstruccion.nombreConstruccion - Nombre del tipo de construcción.
     * @param {string} datosConstruccion.idSistema - ID del sistema donde se construye.
     * @param {string} socketId - ID del socket del jugador.
     * @returns {Object} Resultado de la operación.
     */
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

    /**
     * Crea una instancia de construcción según el tipo.
     * @param {string} nombreConstruccion - Nombre del tipo de construcción.
     * @param {Jugador} jugador - Jugador propietario.
     * @param {SistemaPlanetario} sistemaPlanetario - Sistema donde se construye.
     * @returns {Construccion|null} Instancia de la construcción o null si no es válida.
     */
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

    /**
     * Verifica si el jugador tiene suficientes recursos para la construcción.
     * @param {Jugador} jugador - Jugador a verificar.
     * @param {Construccion} construccion - Construcción a construir.
     * @returns {boolean} Retorna true si el jugador tiene suficientes recursos.
     */
    verificarRecursos(jugador, construccion) {
        return jugador.recursos.suficiente(construccion.costo);
    }
}

module.exports = GestorConstruccion;
