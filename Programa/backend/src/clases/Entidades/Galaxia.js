const SistemaPlanetario = require('./SistemaPlanetario');
const Ruta = require('./Ruta');

/**
 * Representa una galaxia que contiene sistemas planetarios y rutas entre ellos.
 * @class
 */
class Galaxia {
    /**
     * Inicializa la galaxia con un nombre.
     * @param {string} nombre - Nombre de la galaxia.
     */
    constructor(nombre) {
        /**
         * Nombre de la galaxia.
         * @type {string}
         */
        this.nombre = nombre;

        /**
         * Lista de sistemas planetarios en la galaxia.
         * @type {SistemaPlanetario[]}
         */
        this.sistemas = [];

        /**
         * Lista de rutas entre sistemas planetarios.
         * @type {Ruta[]}
         */
        this.rutas = [];
    }

    /**
     * Carga la galaxia desde un objeto JSON.
     * @param {Object} json - Objeto JSON con la configuración de la galaxia.
     */
    cargarDesdeJSON(json) {
        this.nombre = json.nombre;
        this.sistemas = [];
        this.rutas = [];
        this.cargarSistemasDesdeJSON(json.sistemas);
        this.cargarRutasDesdeJSON(json.rutas);
    }

    /**
     * Carga los sistemas planetarios desde datos JSON.
     * @param {Object[]} sistemasData - Array con los datos de los sistemas.
     */
    cargarSistemasDesdeJSON(sistemasData) {
        for (const sys of sistemasData) {
            const sistema = new SistemaPlanetario(sys.id, sys.nombre, sys.tipo);
            this.sistemas.push(sistema);
        }
    }

    /**
     * Carga las rutas desde datos JSON.
     * @param {Array[]} rutasData - Array de arrays con pares de IDs de sistemas conectados.
     */
    cargarRutasDesdeJSON(rutasData) {
        for (const ruta of rutasData) {
            const origen = this.obtenerSistemaPorId(ruta[0]);
            const destino = this.obtenerSistemaPorId(ruta[1]);
            if (origen && destino) {
                this.rutas.push(new Ruta(origen, destino));
            }
        }
    }

    /**
     * Obtiene un sistema planetario por su ID.
     * @param {string} id - ID del sistema a buscar.
     * @returns {SistemaPlanetario|undefined} Sistema encontrado o undefined.
     */
    obtenerSistemaPorId(id) {
        return this.sistemas.find(sistema => sistema.id === id);
    }

    /**
     * Obtiene los sistemas vecinos de un sistema específico.
     * @param {SistemaPlanetario} sistema - Sistema de referencia.
     * @returns {SistemaPlanetario[]} Array de sistemas vecinos.
     */
    obtenerVecinos(sistema) {
        const vecinos = [];
        for (const ruta of this.rutas) {
            const otro = ruta.obtenerOtro(sistema);
            if (otro) {
                vecinos.push(otro);
            }
        }
        return vecinos;
    }

    /**
     * Obtiene la ruta entre dos sistemas específicos.
     * @param {SistemaPlanetario} origen - Sistema de origen.
     * @param {SistemaPlanetario} destino - Sistema de destino.
     * @returns {Ruta|undefined} Ruta encontrada o undefined.
     */
    obtenerRutaEntre(origen, destino) {
        return this.rutas.find(ruta => ruta.conecta(origen, destino));
    }

    /**
     * Obtiene los sistemas controlados por un jugador.
     * @param {Jugador} jugador - Jugador propietario.
     * @returns {SistemaPlanetario[]} Array de sistemas controlados.
     */
    sistemasControladosPor(jugador) {
        return this.sistemas.filter(sistema => sistema.propietario === jugador && sistema.estado === 'controlado');
    }

    /**
     * Convierte la galaxia a formato JSON.
     * @returns {Object} Objeto JSON con nombre, sistemas y rutas.
     */
    toJSON() {
        return {
            nombre: this.nombre,
            sistemas: this.sistemas.map(sistema => sistema.toJSON()),
            rutas: this.rutas.map(ruta => ruta.toJSON())
        };
    }
}

module.exports = Galaxia;