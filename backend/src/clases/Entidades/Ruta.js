class Ruta {
    constructor(origen, destino) {
        this.origen = origen;
        this.destino = destino;
    }

    conecta(sistema1, sistema2) {
        return (this.origen === sistema1 && this.destino === sistema2) ||
               (this.origen === sistema2 && this.destino === sistema1);
    }

    obtenerOtro(sistema) {
        if (this.origen === sistema) return this.destino;
        if (this.destino === sistema) return this.origen;
        return null;
    }

    toJSON() {
        return {
            origen: this.origen?.id || this.origen,
            destino: this.destino?.id || this.destino
        };
    }
}

module.exports = Ruta;