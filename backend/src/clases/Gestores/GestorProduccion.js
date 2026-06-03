const config = require('../Configuración/Configuracion');

class GestorProduccion {
    constructor(gestorTemporizadores, galaxia, estadoRef) {
        this.gestorTemporizadores = gestorTemporizadores;
        this.galaxia = galaxia;
        this.estadoRef = estadoRef;
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
    }

    detenerProduccion() {
        this.gestorTemporizadores.detenerTodos();
    }
}

module.exports = GestorProduccion;
