const Astillero = require('../Construcciones/Astillero');
const GestorCombate = require('./GestorCombate');

class GestorMovimiento {
    constructor(galaxia) {
        this.galaxia = galaxia;
        this.gestorCombate = new GestorCombate();
    }

    existeRuta(origen, destino) {
        if (origen === destino) return true;
        return this.encontrarCamino(origen, destino).length > 0;
    }

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

    moverAstilleros(astilleros, sistemaDestino, callbackEvento) {
        const errores = [];

        console.log('=== MOVER ASTILLEROS EN GESTOR ===');
        console.log('Astilleros a mover:', astilleros.length);
        console.log('Sistema destino:', sistemaDestino.nombre);

        for (const astillero of astilleros) {
            console.log('  Astillero ID:', astillero.id, 'sistemaActual:', astillero.sistemaActual?.nombre);
            const validacion = this.validarMovimiento(astillero, sistemaDestino);
            if (!validacion.valido) {
                errores.push(...validacion.errores);
            }
        }

        if (errores.length > 0) {
            console.log('Errores de validación:', errores);
            return { exitoso: false, errores };
        }

        const sistemaOrigen = astilleros[0].sistemaActual;
        console.log('Sistema origen detectado:', sistemaOrigen?.nombre);
        console.log('Astilleros en origen antes de mover:', sistemaOrigen?.obtenerCantidadAstilleros());

        if (sistemaDestino.propietario && sistemaDestino.propietario !== astilleros[0].propietario) {
            if (this.gestorCombate.puedeAtacar(sistemaDestino, astilleros[0].propietario)) {
                // Primero remover los astilleros del origen ANTES del combate
                for (const astillero of astilleros) {
                    if (astillero.sistemaActual) {
                        console.log('  Removiendo astillero de:', astillero.sistemaActual.nombre);
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
            console.log('  Moviendo astillero desde:', astillero.sistemaActual?.nombre, 'hacia:', sistemaDestino.nombre);
            if (astillero.sistemaActual) {
                astillero.sistemaActual.removerAstillero(astillero);
                console.log('    Astilleros en origen después de remover:', astillero.sistemaActual.obtenerCantidadAstilleros());
            }
            astillero.mover(sistemaDestino);
            sistemaDestino.agregarAstillero(astillero);
            console.log('    Astilleros en destino después de agregar:', sistemaDestino.obtenerCantidadAstilleros());
        }

        if (!sistemaDestino.propietario) {
            sistemaDestino.setPropietario(astilleros[0].propietario);
        }

        console.log('Astilleros en origen final:', sistemaOrigen?.obtenerCantidadAstilleros());
        console.log('Astilleros en destino final:', sistemaDestino.obtenerCantidadAstilleros());
        console.log('================================');

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