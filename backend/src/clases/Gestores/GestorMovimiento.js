const Astillero = require('../Construcciones/Astillero');
const GestorCombate = require('./GestorCombate');

/**
 * Gestiona el movimiento de astilleros entre sistemas planetarios.
 * Valida rutas, resuelve combates y controla la conquista de sistemas.
 * @class
 */
class GestorMovimiento {
    /**
     * Inicializa el gestor de movimiento.
     * @param {Galaxia} galaxia - Galaxia donde se mueven los astilleros.
     */
    constructor(galaxia) {
        /**
         * Galaxia donde se mueven los astilleros.
         * @type {Galaxia}
         */
        this.galaxia = galaxia;
        /**
         * Gestor de combate para resolver conflictos.
         * @type {GestorCombate}
         */
        this.gestorCombate = new GestorCombate();
    }

    /**
     * Verifica si existe una ruta entre dos sistemas.
     * @param {SistemaPlanetario} origen - Sistema de origen.
     * @param {SistemaPlanetario} destino - Sistema de destino.
     * @returns {boolean} Retorna true si existe una ruta válida.
     */
    existeRuta(origen, destino) {
        if (origen === destino) return true;
        return this.encontrarCamino(origen, destino).length > 0;
    }

    /**
     * Encuentra un camino entre dos sistemas usando BFS.
     * @param {SistemaPlanetario} origen - Sistema de origen.
     * @param {SistemaPlanetario} destino - Sistema de destino.
     * @param {Jugador} jugador - Jugador propietario (opcional, para filtrar sistemas).
     * @returns {SistemaPlanetario[]} Array con el camino de sistemas.
     */
    encontrarCamino(origen, destino, jugador) {
        if (origen === destino) return [origen];

        const visitados = new Set();
        const cola = [{ sistema: origen, camino: [origen] }];
        visitados.add(origen);

        while (cola.length > 0) {
            const { sistema, camino } = cola.shift();

            const vecinos = this.galaxia.obtenerVecinos(sistema);
            for (const vecino of vecinos) {
                if (vecino === destino) {
                    return [...camino, destino];
                }
                if (!visitados.has(vecino)) {
                    // Solo agregar si está libre o es del mismo jugador
                    if (!jugador || !vecino.propietario || vecino.propietario === jugador) {
                        visitados.add(vecino);
                        cola.push({ sistema: vecino, camino: [...camino, vecino] });
                    }
                }
            }
        }

        return [];
    }

    /**
     * Valida si un astillero puede moverse a un sistema destino.
     * @param {Astillero} astillero - Astillero a mover.
     * @param {SistemaPlanetario} sistemaDestino - Sistema destino.
     * @returns {Object} Objeto con validación y posibles errores.
     */
    validarMovimiento(astillero, sistemaDestino) {
        const errores = [];

        if (astillero.sistemaActual && sistemaDestino) {
            const jugador = astillero.propietario;
            const camino = this.encontrarCamino(astillero.sistemaActual, sistemaDestino, jugador);
            
            if (camino.length === 0) {
                errores.push('No existe una ruta válida entre los sistemas');
            }
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Mueve astilleros a un sistema destino, resolviendo combates si es necesario.
     * @param {Astillero[]} astilleros - Array de astilleros a mover.
     * @param {SistemaPlanetario} sistemaDestino - Sistema destino.
     * @param {Function} callbackEvento - Callback para emitir eventos.
     * @returns {Object} Resultado del movimiento.
     */
    moverAstilleros(astilleros, sistemaDestino, callbackEvento) {
        const errores = [];


        for (const astillero of astilleros) {
            const validacion = this.validarMovimiento(astillero, sistemaDestino);
            if (!validacion.valido) {
                errores.push(...validacion.errores);
            }
        }

        if (errores.length > 0) {
            return { exitoso: false, errores };
        }

        const sistemaOrigen = astilleros[0].sistemaActual;

        if (sistemaDestino.propietario && sistemaDestino.propietario !== astilleros[0].propietario) {
            if (this.gestorCombate.puedeAtacar(sistemaDestino, astilleros[0].propietario)) {
                // Primero remover los astilleros del origen ANTES del combate
                for (const astillero of astilleros) {
                    if (astillero.sistemaActual) {
                        astillero.sistemaActual.removerAstillero(astillero);
                    }
                }

                const resultado = this.gestorCombate.resolverCombate(
                    sistemaDestino,
                    astilleros,
                    astilleros[0].propietario,
                    callbackEvento
                );

                if (resultado.conquista && callbackEvento) {
                    callbackEvento('sistemaConquistado', {
                        sistema: sistemaDestino,
                        nuevoPropietario: astilleros[0].propietario.nickname
                    });
                }

                for (const astillero of sistemaDestino.astillerosEstacionados) {
                    astillero.mover(sistemaDestino);
                }

                if (callbackEvento) {
                    callbackEvento('astillerosMovidos', {
                        astilleros: astilleros,
                        origen: sistemaOrigen,
                        destino: sistemaDestino
                    });
                }

                return { exitoso: true, resultado };
            }
        }

        for (const astillero of astilleros) {
            if (astillero.sistemaActual) {
                astillero.sistemaActual.removerAstillero(astillero);
            }
            astillero.mover(sistemaDestino);
            sistemaDestino.agregarAstillero(astillero);
        }

        if (!sistemaDestino.propietario) {
            sistemaDestino.setPropietario(astilleros[0].propietario);
        }


        if (callbackEvento) {
            callbackEvento('astillerosMovidos', {
                astilleros: astilleros,
                origen: sistemaOrigen,
                destino: sistemaDestino
            });
        }

        return { exitoso: true };
    }

    
}

module.exports = GestorMovimiento;