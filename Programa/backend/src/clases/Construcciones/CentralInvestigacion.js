const Construccion = require('./Construccion');
const Recursos = require('../Entidades/Recursos');
const config = require('../Configuración/Configuracion');

/**
 * Representa una central de investigación que produce recursos automáticamente cada ciclo.
 * Extiende de la clase Construccion.
 * @class
 * @extends Construccion
 */
class CentralInvestigacion extends Construccion {
    /**
     * Inicializa las propiedades de la central de investigación.
     */
    constructor() {
        const costos = Construccion.obtenerCostosDesdeConfig('CentralInvestigacion');
        super('CentralInvestigacion', costos, 'Produce recursos automáticamente cada ciclo');
    }

    /**
     * Produce recursos para el sistema y jugador según la configuración.
     * @param {SistemaPlanetario} sistema - Sistema planetario donde se encuentra la construcción.
     * @param {Jugador} jugador - Jugador propietario de la construcción.
     * @returns {Recursos} Recursos producidos (minerales, energía y cristales).
     */
    producir(sistema, jugador) {
        const produccionData = config.get('produccionConstrucciones.CentralInvestigacion');
        return new Recursos(produccionData.minerales, produccionData.energia, produccionData.cristales);
    }

    /**
     * Obtiene el poder de defensa de la central de investigación.
     * @returns {number} Poder de defensa (0, ya que no tiene capacidad defensiva).
     */
    getPoderDefensa() {
        return 0;
    }
}

module.exports = CentralInvestigacion;