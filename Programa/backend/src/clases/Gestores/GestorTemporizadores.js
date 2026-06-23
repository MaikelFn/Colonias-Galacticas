/**
 * Gestiona los temporizadores e intervalos utilizados en la partida.
 * Controla tiempos de espera, duración de partida y ciclos de producción.
 * @class
 */
class GestorTemporizadores {
    /**
     * Inicializa los temporizadores.
     */
    constructor() {
        /**
         * Temporizador de espera para iniciar la partida.
         * @type {NodeJS.Timeout|null}
         */
        this.temporizadorEspera = null;

        /**
         * Temporizador de duración máxima de la partida.
         * @type {NodeJS.Timeout|null}
         */
        this.temporizadorDuracion = null;

        /**
         * Intervalo de producción de recursos.
         * @type {NodeJS.Timeout|null}
         */
        this.intervaloProduccion = null;
    }

    /**
     * Inicia el temporizador de espera.
     * @param {number} tiempoSeg - Tiempo de espera en segundos.
     * @param {Function} callback - Función a ejecutar al finalizar el tiempo.
     */
    iniciarTemporizadorEspera(tiempoSeg, callback) {
        this.temporizadorEspera = setTimeout(callback, tiempoSeg * 1000);
    }

    /**
     * Inicia el temporizador de duración de la partida.
     * @param {number} tiempoSeg - Duración máxima en segundos.
     * @param {Function} callback - Función a ejecutar al finalizar el tiempo.
     */
    iniciarTemporizadorDuracion(tiempoSeg, callback) {
        this.temporizadorDuracion = setTimeout(callback, tiempoSeg * 1000);
    }

    /**
     * Inicia el intervalo de producción de recursos.
     * @param {number} cicloSeg - Duración del ciclo en segundos.
     * @param {Function} callback - Función a ejecutar en cada ciclo.
     */
    iniciarIntervaloProduccion(cicloSeg, callback) {
        this.intervaloProduccion = setInterval(callback, cicloSeg * 1000);
    }

    /**
     * Detiene todos los temporizadores e intervalos.
     */
    detenerTodos() {
        if (this.temporizadorEspera) {
            clearTimeout(this.temporizadorEspera);
            this.temporizadorEspera = null;
        }
        if (this.temporizadorDuracion) {
            clearTimeout(this.temporizadorDuracion);
            this.temporizadorDuracion = null;
        }
        if (this.intervaloProduccion) {
            clearInterval(this.intervaloProduccion);
            this.intervaloProduccion = null;
        }
    }

    /**
     * Detiene solo el temporizador de espera.
     */
    detenerTemporizadorEspera() {
        if (this.temporizadorEspera) {
            clearTimeout(this.temporizadorEspera);
            this.temporizadorEspera = null;
        }
    }

    /**
     * Verifica si hay producción activa.
     * @returns {boolean} Retorna true si el intervalo de producción está activo.
     */
    estaProduciendo() {
        return this.intervaloProduccion !== null;
    }
}

module.exports = GestorTemporizadores;
