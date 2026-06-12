class GestorCombate {
    calcularFuerzaAtacante(astillerosAtacantes) {
        return astillerosAtacantes.length;
    }

    calcularFuerzaDefensor(sistema) {
        let fuerza = 0;

        const minas = sistema.instalaciones.filter(instalacion => instalacion.nombre === 'Mina');
        fuerza += Math.floor(minas.length / 3);

        for (const astillero of sistema.astillerosEstacionados) {
            fuerza += 1;
        }

        const fortalezas = sistema.instalaciones.filter(instalacion => instalacion.nombre === 'Fortaleza');
        for (const fortaleza of fortalezas) {
            fuerza += 2;
        }

        return fuerza;
    }

    resolverCombate(sistema, astillerosAtacantes, jugadorAtacante, callbackEvento) {
        const fuerzaAtacante = this.calcularFuerzaAtacante(astillerosAtacantes);
        const fuerzaDefensor = this.calcularFuerzaDefensor(sistema);
        const minasResiduales = sistema.instalaciones.filter(instalacion => instalacion.nombre === 'Mina').length % 3;
        const defensorGana = fuerzaDefensor > fuerzaAtacante ||
                             (fuerzaDefensor === fuerzaAtacante && minasResiduales > 0);

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
        } else if (defensorGana) {
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

            sistema.instalaciones = sistema.instalaciones.filter(instalacion => instalacion.nombre === 'CentralInvestigacion');
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

        const centrosInvestigacion = sistema.instalaciones.filter(instalacion => instalacion.nombre === 'CentralInvestigacion');
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
        let restantes = perdidas;

        // 1ro: astilleros
        while (restantes > 0 && sistema.astillerosEstacionados.length > 0) {
            sistema.astillerosEstacionados.pop();
            restantes--;
        }

        // 2do: minas (grupos de 3)
        while (restantes > 0 && sistema.instalaciones.filter(instalacion => instalacion.nombre === 'Mina').length >= 3) {
            let eliminadas = 0;
            sistema.instalaciones = sistema.instalaciones.filter(instalacion => {
                if (instalacion.nombre === 'Mina' && eliminadas < 3) { eliminadas++; return false; }
                return true;
            });
            restantes--;
        }

        // 3ro: fortalezas
        while (restantes > 0) {
            const idx = sistema.instalaciones.findIndex(instalacion => instalacion.nombre === 'Fortaleza');
            if (idx === -1) break;
            sistema.instalaciones.splice(idx, 1);
            restantes -= 2;
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