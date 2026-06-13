/**
 * Representa los recursos del juego: minerales, energía y cristales.
 * @class
 */
class Recursos {
    /**
     * Inicializa los recursos del juego.
     * @param {number} minerales - Cantidad de minerales.
     * @param {number} energia - Cantidad de energía.
     * @param {number} cristales - Cantidad de cristales.
     */
    constructor(minerales, energia, cristales) {
        /**
         * Cantidad de minerales.
         * @type {number}
         */
        this.minerales = minerales;

        /**
         * Cantidad de energía.
         * @type {number}
         */
        this.energia = energia;

        /**
         * Cantidad de cristales.
         * @type {number}
         */
        this.cristales = cristales;
    }

    /**
     * Verifica si los recursos son suficientes para cubrir un costo.
     * @param {Recursos} costo - Costo a verificar.
     * @returns {boolean} Retorna true si los recursos son suficientes.
     */
    suficiente(costo) {
        return this.minerales >= costo.minerales &&
               this.energia >= costo.energia &&
               this.cristales >= costo.cristales;
    }

    /**
     * Agrega recursos a los existentes.
     * @param {Recursos} recursos - Recursos a agregar.
     * @returns {Recursos} Nuevo objeto Recursos con la suma.
     */
    agregar(recursos) {
        return new Recursos(
            this.minerales + recursos.minerales,
            this.energia + recursos.energia,
            this.cristales + recursos.cristales
        );
    }

    /**
     * Resta recursos a los existentes.
     * @param {Recursos} recursos - Recursos a restar.
     * @returns {Recursos} Nuevo objeto Recursos con la diferencia.
     * @throws {Error} Si los recursos son insuficientes.
     */
    restar(recursos) {
        if (!this.suficiente(recursos)) {
            throw new Error(`Recursos insuficientes: faltan minerales=${recursos.minerales - this.minerales}, energia=${recursos.energia - this.energia}, cristales=${recursos.cristales - this.cristales}`);
        }
        return new Recursos(
            this.minerales - recursos.minerales,
            this.energia - recursos.energia,
            this.cristales - recursos.cristales
        );
    }

    /**
     * Convierte los recursos a formato JSON.
     * @returns {Object} Objeto JSON con minerales, energía y cristales.
     */
    toJSON() {
        return {
            minerales: this.minerales,
            energia: this.energia,
            cristales: this.cristales
        };
    }
}

module.exports = Recursos;