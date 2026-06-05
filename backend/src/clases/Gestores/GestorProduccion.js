const config = require('../Configuración/Configuracion');

class GestorProduccion {
    constructor(gestorTemporizadores, galaxia, estadoRef, io = null) {
        this.gestorTemporizadores = gestorTemporizadores;
        this.galaxia = galaxia;
        this.estadoRef = estadoRef;
        this.io = io;
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

                if (this.io && sistema.propietario.socketId) {
                    this.io.to(sistema.propietario.socketId).emit("recursos_actualizados", {
                        jugadorId: sistema.propietario.socketId,
                        recursos: sistema.propietario.recursos
                    });
                }
            }
        }
    }

    detenerProduccion() {
        this.gestorTemporizadores.detenerTodos();
    }
}

module.exports = GestorProduccion;
