// Recursos.js
class Recursos {
    constructor(minerales, energia, cristales) {
        this.minerales = minerales;
        this.energia = energia;
        this.cristales = cristales;
    }
    suficiente(costo) {
        return this.minerales >= costo.minerales &&
               this.energia >= costo.energia &&
               this.cristales >= costo.cristales;
    }
    agregar(recursos) {
        return new Recursos(
            this.minerales + recursos.minerales,
            this.energia + recursos.energia,
            this.cristales + recursos.cristales
        );
    }

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
    toJSON() {
        return {
            minerales: this.minerales,
            energia: this.energia,
            cristales: this.cristales
        };
    }
}

module.exports = Recursos;