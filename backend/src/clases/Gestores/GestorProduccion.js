const config = require('../Configuración/Configuracion');

class GestorProduccion {
    constructor(gestorTemporizadores, galaxia, estadoRef, onProduccionRecursos) {
        this.gestorTemporizadores = gestorTemporizadores;
        this.galaxia = galaxia;
        this.estadoRef = estadoRef;
        this.onProduccionRecursos = onProduccionRecursos;
    }

    iniciarProduccion() {
        const cicloProduccion = config.get('juego.cicloProduccionSeg');
        this.gestorTemporizadores.iniciarIntervaloProduccion(cicloProduccion, () => {
            this.producirRecursos();
        });
    }

    producirRecursos() {
        if (this.estadoRef.estado !== 'iniciada') return;
        for (const sistema of this.galaxia.sistemas) {
            if (sistema.propietario && sistema.estado === 'controlado') {
                const produccion = sistema.obtenerProduccionTotal();
                sistema.propietario.agregarRecursos(produccion);
            }
        }

        // Llamar al callback para que serve.js maneje la emisión del evento
        if (this.onProduccionRecursos) {
            this.onProduccionRecursos(this.estadoRef);
        }
    }

    detenerProduccion() {
        this.gestorTemporizadores.detenerTodos();
    }
}

module.exports = GestorProduccion;
