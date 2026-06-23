const fs = require('fs');
const path = require('path');

/**
 * Clase que gestiona la configuración del juego leyendo desde un archivo JSON.
 * Proporciona acceso a los valores de configuración mediante notación de puntos.
 * @class
 */
class Configuracion {
    /**
     * Inicializa la configuración leyendo el archivo JSON.
     */
    constructor() {
        const data = fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'Configuracion.json'), 'utf8');
        /**
         * Valores de configuración cargados desde el archivo JSON.
         * @type {Object}
         */
        this.valores = JSON.parse(data);
    }

    /**
     * Obtiene un valor de configuración usando notación de puntos.
     * @param {string} key - Clave de configuración usando notación de puntos (ej: 'costosConstrucciones.Astillero').
     * @returns {*} Valor de configuración correspondiente a la clave.
     */
    get(key) {
        return key.split('.').reduce((objeto, clave) => objeto && objeto[clave], this.valores);
    }
}

module.exports = new Configuracion();