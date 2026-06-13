/**
 * Representa una ruta entre dos sistemas planetarios.
 * @class
 */
class Ruta {
    /**
     * Inicializa la ruta entre dos sistemas.
     * @param {SistemaPlanetario} origen - Sistema planetario de origen.
     * @param {SistemaPlanetario} destino - Sistema planetario de destino.
     */
    constructor(origen, destino) {
        /**
         * Sistema planetario de origen.
         * @type {SistemaPlanetario}
         */
        this.origen = origen;

        /**
         * Sistema planetario de destino.
         * @type {SistemaPlanetario}
         */
        this.destino = destino;
    }

    /**
     * Verifica si la ruta conecta dos sistemas específicos.
     * @param {SistemaPlanetario} sistema1 - Primer sistema a verificar.
     * @param {SistemaPlanetario} sistema2 - Segundo sistema a verificar.
     * @returns {boolean} Retorna true si la ruta conecta ambos sistemas.
     */
    conecta(sistema1, sistema2) {
        return (this.origen === sistema1 && this.destino === sistema2) ||
               (this.origen === sistema2 && this.destino === sistema1);
    }

    /**
     * Obtiene el sistema opuesto en la ruta.
     * @param {SistemaPlanetario} sistema - Sistema de referencia.
     * @returns {SistemaPlanetario|null} Sistema opuesto o null si no coincide.
     */
    obtenerOtro(sistema) {
        if (this.origen === sistema) return this.destino;
        if (this.destino === sistema) return this.origen;
        return null;
    }

    /**
     * Convierte la ruta a formato JSON.
     * @returns {Object} Objeto JSON con los IDs de origen y destino.
     */
    toJSON() {
        return {
            origen: this.origen.id,
            destino: this.destino.id
        };
    }
}

module.exports = Ruta;