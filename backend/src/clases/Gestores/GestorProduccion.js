const config = require('../Configuración/Configuracion');

/**
 * Gestiona la producción de recursos en la partida.
 * Controla los ciclos de producción y distribución de recursos a los jugadores.
 * @class
 */
class GestorProduccion {
    /**
     * Inicializa el gestor de producción.
     * @param {GestorTemporizadores} gestorTemporizadores - Gestor de temporizadores.
     * @param {Galaxia} galaxia - Galaxia donde se produce.
     * @param {Partida} estadoRef - Referencia a la partida.
     * @param {Function} onProduccionRecursos - Callback cuando se producen recursos.
     */
    constructor(gestorTemporizadores, galaxia, estadoRef, onProduccionRecursos) {
        /**
         * Gestor de temporizadores.
         * @type {GestorTemporizadores}
         */
        this.gestorTemporizadores = gestorTemporizadores;

        /**
         * Galaxia donde se produce.
         * @type {Galaxia}
         */
        this.galaxia = galaxia;

        /**
         * Referencia a la partida.
         * @type {Partida}
         */
        this.estadoRef = estadoRef;

        /**
         * Callback cuando se producen recursos.
         * @type {Function}
         */
        this.onProduccionRecursos = onProduccionRecursos;
    }

    /**
     * Inicia la producción de recursos.
     */
    iniciarProduccion() {
        const cicloProduccion = config.get('juego.cicloProduccionSeg');
        this.gestorTemporizadores.iniciarIntervaloProduccion(cicloProduccion, () => {
            this.producirRecursos();
        });
    }

    /**
     * Produce recursos para todos los sistemas controlados.
     */
    producirRecursos() {
        if (this.estadoRef.estado !== 'iniciada') return;
        for (const sistema of this.galaxia.sistemas) {
            if (sistema.propietario && sistema.estado === 'controlado') {
                const produccion = sistema.obtenerProduccionTotal();
                sistema.propietario.agregarRecursos(produccion);
                sistema.totalProducido = sistema.totalProducido.agregar(produccion);
            }
        }

        if (this.onProduccionRecursos) {
            this.onProduccionRecursos(this.estadoRef);
        }
    }

    /**
     * Detiene la producción de recursos.
     */
    detenerProduccion() {
        this.gestorTemporizadores.detenerTodos();
    }
}

module.exports = GestorProduccion;
