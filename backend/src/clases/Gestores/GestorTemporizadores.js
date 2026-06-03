class GestorTemporizadores {
    constructor() {
        this.temporizadorEspera = null;
        this.temporizadorDuracion = null;
        this.intervaloProduccion = null;
    }

    iniciarTemporizadorEspera(tiempoSeg, callback) {
        this.temporizadorEspera = setTimeout(callback, tiempoSeg * 1000);
    }

    iniciarTemporizadorDuracion(tiempoSeg, callback) {
        this.temporizadorDuracion = setTimeout(callback, tiempoSeg * 1000);
    }

    iniciarIntervaloProduccion(cicloSeg, callback) {
        this.intervaloProduccion = setInterval(callback, cicloSeg * 1000);
    }

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

    detenerTemporizadorEspera() {
        if (this.temporizadorEspera) {
            clearTimeout(this.temporizadorEspera);
            this.temporizadorEspera = null;
        }
    }

    estaProduciendo() {
        return this.intervaloProduccion !== null;
    }
}

module.exports = GestorTemporizadores;
