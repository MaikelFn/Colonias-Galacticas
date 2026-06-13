const Recursos = require('./Recursos');
const config = require('../Configuración/Configuracion');

/**
 * Representa un sistema planetario en la galaxia.
 * Contiene instalaciones, astilleros y produce recursos.
 * @class
 */
class SistemaPlanetario {
    /**
     * Inicializa las propiedades del sistema planetario.
     * @param {string} id - Identificador único del sistema.
     * @param {string} nombre - Nombre del sistema planetario.
     * @param {string} tipo - Tipo de planeta (ej: 'terrestre', 'gaseoso', etc.).
     */
    constructor(id, nombre, tipo) {
        /**
         * Identificador único del sistema.
         * @type {string}
         */
        this.id = id;

        /**
         * Nombre del sistema planetario.
         * @type {string}
         */
        this.nombre = nombre;

        /**
         * Tipo de planeta.
         * @type {string}
         */
        this.tipo = tipo;

        /**
         * Jugador propietario del sistema.
         * @type {Jugador|null}
         */
        this.propietario = null;

        /**
         * Astilleros estacionados en el sistema.
         * @type {Astillero[]}
         */
        this.astillerosEstacionados = [];

        /**
         * Instalaciones construidas en el sistema.
         * @type {Construccion[]}
         */
        this.instalaciones = [];

        /**
         * Estado del sistema ('no explorado', 'controlado').
         * @type {string}
         */
        this.estado = 'no explorado';

        /**
         * Total de recursos producidos por el sistema.
         * @type {Recursos}
         */
        this.totalProducido = new Recursos(0, 0, 0);
    }

    /**
     * Obtiene la producción base del sistema según su tipo.
     * @returns {Object} Objeto con la producción base de minerales, energía y cristales.
     */
    obtenerProduccionBase() {
        const produccionPlanetas = config.get('produccionPlanetas');
        const tipoLower = this.tipo.toLowerCase();
        return produccionPlanetas[tipoLower];
    }

    /**
     * Obtiene la producción total del sistema (base + centrales de investigación).
     * @returns {Recursos} Recursos totales producidos.
     */
    obtenerProduccionTotal() {
        const base = this.obtenerProduccionBase();
        let total = new Recursos(base.minerales, base.energia, base.cristales);
        
        const centrales = this.instalaciones.filter(instalacion => instalacion.nombre === 'CentralInvestigacion');
        for (const central of centrales) {
            const prod = central.producir(this, this.propietario);
            total = total.agregar(prod);
        }
        
        return total;
    }

    /**
     * Verifica si el sistema puede ser controlado.
     * @returns {boolean} Retorna true si el sistema no ha sido explorado.
     */
    esControlable() {
        return this.estado === 'no explorado';
    }

    /**
     * Establece el propietario del sistema.
     * @param {Jugador} jugador - Jugador que controlará el sistema.
     */
    setPropietario(jugador) {
        this.propietario = jugador;
        this.estado = 'controlado';
    }

    /**
     * Libera el sistema, eliminando su propietario y astilleros.
     */
    liberar() {
        this.propietario = null;
        this.estado = 'no explorado';
        this.astillerosEstacionados = [];
    }

    /**
     * Agrega una instalación al sistema.
     * @param {Construccion} construccion - Construcción a agregar.
     */
    agregarInstalacion(construccion) {
        this.instalaciones.push(construccion);
    }

    /**
     * Remueve una instalación del sistema por su índice.
     * @param {number} indice - Índice de la instalación a remover.
     */
    removerInstalacion(indice) {
        this.instalaciones.splice(indice, 1);
    }

    /**
     * Agrega un astillero al sistema.
     * @param {Astillero} astillero - Astillero a agregar.
     */
    agregarAstillero(astillero) {
        this.astillerosEstacionados.push(astillero);
    }

    /**
     * Remueve un astillero del sistema.
     * @param {Astillero} astillero - Astillero a remover.
     */
    removerAstillero(astillero) {
        const indice = this.astillerosEstacionados.indexOf(astillero);
        if (indice !== -1) {
            this.astillerosEstacionados.splice(indice, 1);
        }
    }

    /**
     * Obtiene la cantidad de astilleros estacionados.
     * @returns {number} Cantidad de astilleros.
     */
    obtenerCantidadAstilleros() {
        return this.astillerosEstacionados.length;
    }

    /**
     * Convierte el sistema planetario a formato JSON.
     * @returns {Object} Objeto JSON con la información del sistema.
     */
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