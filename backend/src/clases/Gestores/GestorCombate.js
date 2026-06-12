class GestorCombate {
    calcularFuerzaAtacante(astillerosAtacantes) {
        return astillerosAtacantes.length;
    }

    calcularFuerzaDefensor(sistema) {
        let fuerza = 0;

        const minas = sistema.instalaciones.filter(inst => inst.nombre === 'Mina');
        fuerza += Math.floor(minas.length / 3);

        for (const astillero of sistema.astillerosEstacionados) {
            fuerza += astillero.getPoderCombate();
        }

        const fortalezas = sistema.instalaciones.filter(inst => inst.nombre === 'Fortaleza');
        for (const fortaleza of fortalezas) {
            fuerza += fortaleza.getPoderDefensa();
        }

        return fuerza;
    }

    resolverCombate(sistema, astillerosAtacantes, jugadorAtacante, callbackEvento) {
        const fuerzaAtacante = this.calcularFuerzaAtacante(astillerosAtacantes);
        const fuerzaDefensor = this.calcularFuerzaDefensor(sistema);
        
        const resultado = {
            atacante: jugadorAtacante.nickname,
            sistema: sistema.nombre,
            fuerzaAtacante,
            fuerzaDefensor,
            ganador: null,
            perdidasAtacante: 0,
            perdidasDefensor: 0,
            conquista: false
        };

        if (fuerzaAtacante > fuerzaDefensor) {
            resultado.ganador = jugadorAtacante.nickname;
            resultado.perdidasAtacante = fuerzaDefensor;
            resultado.perdidasDefensor = fuerzaDefensor;
            resultado.conquista = true;
            
            this.aplicarConquista(sistema, jugadorAtacante, astillerosAtacantes, resultado.perdidasAtacante);
        } else if (fuerzaDefensor > fuerzaAtacante) {
            const defensor = sistema.propietario;
            resultado.ganador = defensor ? defensor.nickname : 'Sistema';
            resultado.perdidasAtacante = astillerosAtacantes.length;
            resultado.perdidasDefensor = astillerosAtacantes.length;
            
            this.aplicarDefensaExitosa(sistema, resultado.perdidasDefensor);
            this.eliminarAstilleros(astillerosAtacantes);
        } else {
            resultado.ganador = 'empate';
            resultado.perdidasAtacante = astillerosAtacantes.length;
            resultado.perdidasDefensor = sistema.astillerosEstacionados.length;
            
            this.eliminarAstilleros(astillerosAtacantes);
            
            sistema.instalaciones = sistema.instalaciones.filter(inst => inst.nombre === 'CentralInvestigacion');
            sistema.astillerosEstacionados = [];
        }

        if (callbackEvento) {
            callbackEvento('combateResuelto', resultado);
        }

        return resultado;
    }

    aplicarConquista(sistema, nuevoPropietario, astillerosAtacantes, perdidas) {
        sistema.propietario = nuevoPropietario;
        sistema.estado = 'controlado';

        const centrosInvestigacion = sistema.instalaciones.filter(inst => inst.nombre === 'CentralInvestigacion');
        sistema.instalaciones = centrosInvestigacion;

        const astillerosRestantes = astillerosAtacantes.slice(perdidas);

        sistema.astillerosEstacionados = astillerosRestantes;
    }

    eliminarAstilleros(astilleros) {
        for (const astillero of astilleros) {
            if (astillero.sistemaActual) {
                astillero.sistemaActual.removerAstillero(astillero);
            }
        }
    }

    aplicarDefensaExitosa(sistema, perdidas) {
        let perdidasRestantes = perdidas;

        while (perdidasRestantes > 0 && sistema.astillerosEstacionados.length > 0) {
            sistema.astillerosEstacionados.pop();
            perdidasRestantes--;
        }

        const minas = sistema.instalaciones.filter(inst => inst.nombre === 'Mina');
        const defensaMinas = Math.floor(minas.length / 3);
        
        const perdidasAbsorbidasPorMinas = Math.min(defensaMinas, perdidasRestantes);
        perdidasRestantes -= perdidasAbsorbidasPorMinas;
        
        const minasAEliminar = perdidasAbsorbidasPorMinas * 3;
        for (let i = 0; i < minasAEliminar && i < minas.length; i++) {
            const indiceMina = sistema.instalaciones.findIndex(inst => inst.nombre === 'Mina');
            if (indiceMina !== -1) {
                sistema.instalaciones.splice(indiceMina, 1);
            }
        }
        
        while (perdidasRestantes > 0) {
            const indiceFortaleza = sistema.instalaciones.findIndex(inst => inst.nombre === 'Fortaleza');
            if (indiceFortaleza === -1) break;
            sistema.instalaciones.splice(indiceFortaleza, 1);
            perdidasRestantes -= 2;
        }
    }

    puedeAtacar(sistema, jugador) {
        if (!sistema.propietario || sistema.propietario === jugador) {
            return false;
        }
        return true;
    }
}

module.exports = GestorCombate;