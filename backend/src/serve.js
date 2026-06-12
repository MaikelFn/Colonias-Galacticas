require('dotenv').config()
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const { guardarPartidaEnRanking, obtenerRanking } = require('./db/ranking')
const Galaxia = require('./clases/Entidades/Galaxia');
const Jugador = require('./clases/Entidades/Jugador');
const { Partida } = require('./clases/Entidades/Partida');
const GestorConstruccion = require('./clases/Gestores/GestorConstruccion');

function cargarConfiguracion() {
    const rutaConfig = path.join(__dirname, 'data', 'Configuracion.json');
    try {
        const contenido = fs.readFileSync(rutaConfig, 'utf8');
        return JSON.parse(contenido);
    } catch (error) {
        return null;
    }
}

const configuracion = cargarConfiguracion();

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

const partidas = new Map();
const jugadores = new Map();

function cargarGalaxias() {
    const galaxiasDir = path.join(__dirname, 'data', 'Galaxias');
    const galaxias = [];

    try {
        const archivos = fs.readdirSync(galaxiasDir);
        
        for (const archivo of archivos) {
            if (archivo.endsWith('.json')) {
                const rutaArchivo = path.join(galaxiasDir, archivo);
                const contenido = fs.readFileSync(rutaArchivo, 'utf8');
                const galaxia = JSON.parse(contenido);
                galaxias.push({
                    id: archivo.replace('.json', ''),
                    nombre: galaxia.nombre,
                    sistemas: galaxia.sistemas,
                    rutas: galaxia.rutas
                });
            }
        }
        
        return galaxias;
    } catch (error) {
        return [];
    }
}

const galaxiasDisponibles = cargarGalaxias();

function cargarGalaxiaDesdeArchivo(idGalaxia) {
    const galaxiasDir = path.join(__dirname, 'data', 'Galaxias');
    const rutaArchivo = path.join(galaxiasDir, `${idGalaxia}.json`);

    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        const galaxiaData = JSON.parse(contenido);
        const galaxia = new Galaxia(galaxiaData.nombre);
        galaxia.cargarDesdeJSON(galaxiaData);
        return galaxia;
    } catch (error) {
        return null;
    }
}

io.on("connection", (socket) => {

    socket.on("registrar_jugador", (datos) => {
        const { nombre } = datos;
        const jugador = new Jugador(nombre, socket.id);
        jugadores.set(socket.id, jugador);
        socket.emit("registrar_exitoso", { id: socket.id, nombre });
    });

    socket.on("obtener_galaxias", () => {
        socket.emit("galaxias_disponibles", galaxiasDisponibles);
    });

    socket.on("obtener_configuracion", () => {
        if (configuracion && configuracion.juego && configuracion.juego.recursosIniciales) {
            socket.emit("configuracion_recursos", configuracion.juego.recursosIniciales);
        } else {
            socket.emit("configuracion_recursos", {});
        }
    });

    socket.on("obtener_partidas", () => {
        const disponibles = Array.from(partidas.values()).filter(p =>
            p.estado === 'esperando' && p.jugadores.length < p.maxJugadores
        );
        const partidasInfo = disponibles.map(p => ({
            id: p.id,
            nombre: p.nombre,
            galaxia: p.galaxia.nombre,
            maxJugadores: p.maxJugadores,
            duracion: Math.floor(p.duracionMaximaSeg / 60),
            recursos: p.dificultadRecursos,
            estado: p.estado,
            jugadores: p.jugadores.map(j => ({ id: j.socketId, nombre: j.nickname }))
        }));
        socket.emit("partidas_disponibles", partidasInfo);
    });

    socket.on("obtener_ranking", async () => {
        try {
            const ranking = await obtenerRanking();
            socket.emit("ranking_disponible", ranking);
        } catch (error) {
            socket.emit("error_ranking", { mensaje: "Error al obtener el ranking" });
        }
    });

    socket.on("crear_partida", (datos) => {
        const { nombre, galaxiaId, maxJugadores, duracion, recursos, comandante } = datos;
        const idPartida = `partida_${Date.now()}`;

        const galaxia = cargarGalaxiaDesdeArchivo(galaxiaId);
        if (!galaxia) {
            socket.emit("error_crear_partida", { mensaje: "No se pudo cargar la galaxia seleccionada" });
            return;
        }

        const jugadorCreador = jugadores.get(socket.id);
        if (!jugadorCreador) {
            socket.emit("error_crear_partida", { mensaje: "Jugador no registrado" });
            return;
        }

        const partida = new Partida(
            idPartida,
            nombre,
            galaxia,
            maxJugadores,
            duracion * 60,
            recursos,
            null,
            (partidaCerrada) => {
                io.to(idPartida).emit("partida_cerrada", {
                    idPartida: partidaCerrada.id,
                    razon: "Tiempo de espera agotado. No se alcanzaron los jugadores mínimos."
                });
                partidas.delete(idPartida);
            },
            (partida) => {
                const jugadoresInfo = partida.jugadores.map(j => ({
                    id: j.socketId,
                    nombre: j.nickname,
                    recursos: j.recursos,
                    sistemasConquistados: j.getSistemasControlados().length
                }));

                partida.jugadores.forEach(jugador => {
                    if (jugador.socketId) {
                        io.to(jugador.socketId).emit("actualizar_clientes", {
                            jugadores: jugadoresInfo,
                            galaxia: {
                                nombre: partida.galaxia.nombre,
                                sistemas: partida.galaxia.sistemas.map(sistema => sistema.toJSON()),
                                rutas: partida.galaxia.rutas.map(r => [r.origen.id, r.destino.id])
                            }
                        });
                    }
                });
            },
            io,
            async (datosFinales) => {
                try {
                    await guardarPartidaEnRanking(datosFinales);
                } catch (error) {
                }
            },
            (idPartidaADestruir) => {
                partidas.delete(idPartidaADestruir);
                clearInterval(partidas.get(idPartidaADestruir)?._timerInterval);
            }
        );


        partida.agregarJugador(jugadorCreador);
        partidas.set(idPartida, partida);


        socket.join(idPartida);
        socket.emit("partida_creada", {
            id: partida.id,
            nombre: partida.nombre,
            galaxia: partida.galaxia.nombre,
            maxJugadores: partida.maxJugadores,
            duracion: duracion,
            recursos: partida.dificultadRecursos,
            jugadores: partida.jugadores.map(j => ({ id: j.socketId, nombre: j.nickname }))
        });
    });

    socket.on("unirse_partida", (datos) => {
        const { idPartida, nombreJugador } = datos;
        const partida = partidas.get(idPartida);


        if (!partida) {
            socket.emit("error_unirse", { mensaje: "La partida no existe." });
            return;
        }
        if (partida.estado !== 'esperando') {
            socket.emit("error_unirse", { mensaje: "La partida ya no está disponible." });
            return;
        }
        if (partida.jugadores.length >= partida.maxJugadores) {
            socket.emit("error_unirse", { mensaje: "La partida ya está llena." });
            return;
        }

        const jugadorUnirse = jugadores.get(socket.id);
        if (!jugadorUnirse) {
            socket.emit("error_unirse", { mensaje: "Jugador no registrado" });
            return;
        }

        partida.agregarJugador(jugadorUnirse);
        socket.join(idPartida);


        io.to(idPartida).emit("jugador_unido", {
            idPartida,
            jugador: { id: socket.id, nombre: nombreJugador },
            totalJugadores: partida.jugadores.length
        });

        socket.emit("partida_unida", {
            id: partida.id,
            nombre: partida.nombre,
            galaxia: partida.galaxia.nombre,
            maxJugadores: partida.maxJugadores,
            duracion: Math.floor(partida.duracionMaximaSeg / 60),
            recursos: partida.dificultadRecursos,
            jugadores: partida.jugadores.map(j => ({ id: j.socketId, nombre: j.nickname }))
        });
    });

    socket.on("chat_mensaje", (datos) => {
        const { idPartida, nombreJugador, mensaje, idLocal } = datos;
        socket.to(idPartida).emit("chat_mensaje", { 
            idPartida, 
            nombreJugador, 
            mensaje, 
            idLocal 
        });
    });

    socket.on("salir_sala", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);


        if (partida) {
            partida.jugadores = partida.jugadores.filter(j => j.socketId !== socket.id);
            socket.leave(idPartida);
            
            
            io.to(idPartida).emit("jugador_salio", { 
                idPartida, 
                jugadorId: socket.id 
            });

            if (partida.jugadores.length === 0) {
                partidas.delete(idPartida);
                clearInterval(partida._timerInterval);
            } else if (partida.estado === 'iniciada' && partida.jugadores.length === 1) {
                partida.finalizarPorEliminacion();
            }
        }
    });

    socket.on("iniciar_partida", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);

        if (!partida) {
            socket.emit("error_inicio", { mensaje: "La partida no existe." });
            return;
        }


        if (partida.estado !== 'esperando') {
            socket.emit("error_inicio", { mensaje: "La partida ya no está en estado de espera." });
            return;
        }

        if (partida.jugadores.length < 2) {
            socket.emit("error_inicio", { mensaje: "Se necesitan al menos 2 jugadores para iniciar." });
            return;
        }

        const iniciada = partida.iniciar();
        
       if (iniciada) {

            let cuenta = 3;
            io.to(idPartida).emit('cuenta_regresiva', { idPartida, cuenta });

            const intervalo = setInterval(() => {
                cuenta--;
                io.to(idPartida).emit('cuenta_regresiva', { idPartida, cuenta });

                if (cuenta <= 0) {
                    clearInterval(intervalo);

                    const inicioMs = Date.now();
                    const duracionMs = partida.duracionMaximaSeg * 1000;

                    partida._timerInterval = setInterval(() => {
                        const transcurrido = Date.now() - inicioMs;
                        const restanteSeg = Math.max(0, Math.ceil((duracionMs - transcurrido) / 1000));
                        io.to(idPartida).emit('tick_timer', { segsRestantes: restanteSeg });
                        if (restanteSeg <= 0) clearInterval(partida._timerInterval);
                    }, 1000);

                    io.to(idPartida).emit('partida_iniciada', {
                        idPartida: partida.id,
                        estado: partida.estado,
                        jugadores: partida.jugadores.map(j => ({
                            id: j.socketId,
                            nombre: j.nickname,
                            planetaBase: j.planetaBase ? j.planetaBase.nombre : null,
                            recursos: j.recursos,
                            sistemasConquistados: j.getSistemasControlados().length
                        })),
                        galaxia: {
                            nombre: partida.galaxia.nombre,
                            sistemas: partida.galaxia.sistemas,
                            rutas: partida.galaxia.rutas.map(r => [r.origen.id, r.destino.id])
                        }
                    });
                }
            }, 1000);

        } else {
            socket.emit("error_inicio", { mensaje: "No se pudo iniciar la partida." });
        }
    });

    socket.on("abandonar_partida", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);
        
        if (partida) {
            partida.jugadores = partida.jugadores.filter(j => j.socketId !== socket.id);
            
            io.to(idPartida).emit("jugador_salio", { 
                idPartida, 
                jugadorId: socket.id 
            });
            
            if (partida.jugadores.length === 0) {
                partidas.delete(idPartida);
                clearInterval(partida._timerInterval);
            } else if (partida.estado === 'iniciada' && partida.jugadores.length === 1) {
                partida.finalizarPorEliminacion();
            }
        }
    });

    socket.on("construccion", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);

        if (!partida) {
            socket.emit("construccion_error", { mensaje: "La partida no existe." });
            return;
        }

        const gestor = new GestorConstruccion(partida);
        const resultado = gestor.construir(datos, socket.id);

        if (resultado.success) {
            socket.emit("construccion_exito", {
                mensaje: resultado.mensaje,
                construccion: resultado.construccion,
                sistema: resultado.sistema,
                recursosRestantes: resultado.recursosRestantes
            });

            const jugadoresInfo = partida.jugadores.map(jugador => ({
                id: jugador.socketId,
                nombre: jugador.nickname,
                recursos: jugador.recursos,
                sistemasConquistados: jugador.getSistemasControlados().length
            }));

            partida.jugadores.forEach(jugador => {
                if (jugador.socketId) {
                    io.to(jugador.socketId).emit("actualizar_clientes", {
                        jugadores: jugadoresInfo,
                        galaxia: {
                            nombre: partida.galaxia.nombre,
                            sistemas: partida.galaxia.sistemas.map(s => s.toJSON()),
                            rutas: partida.galaxia.rutas.map(r => [r.origen.id, r.destino.id])
                        }
                    });
                }
            });
        } else {
            socket.emit("construccion_error", {
                mensaje: resultado.error,
                costo: resultado.costo,
                recursosActuales: resultado.recursosActuales
            });
        }
    });

    socket.on("mover_flotas", (datos) => {
        const { idPartida, idSistemaOrigen, idSistemaDestino, cantidad } = datos;
        const partida = partidas.get(idPartida);


        if (!partida) {
            socket.emit("mover_flotas_error", { mensaje: "La partida no existe." });
            return;
        }

        const jugador = partida.jugadores.find(j => j.socketId === socket.id);
        if (!jugador) {
            socket.emit("mover_flotas_error", { mensaje: "Jugador no encontrado en la partida." });
            return;
        }


        const sistemaOrigen = partida.galaxia.sistemas.find(s => s.id === idSistemaOrigen);
        const sistemaDestino = partida.galaxia.sistemas.find(s => s.id === idSistemaDestino);



        if (!sistemaOrigen || !sistemaDestino) {
            socket.emit("mover_flotas_error", { mensaje: "Sistema no encontrado." });
            return;
        }

        if (sistemaOrigen.propietario !== jugador) {
            socket.emit("mover_flotas_error", { mensaje: "No eres el propietario del sistema de origen." });
            return;
        }

        const flotasDisponibles = sistemaOrigen.obtenerCantidadAstilleros();
        if (cantidad > flotasDisponibles) {
            socket.emit("mover_flotas_error", { mensaje: `No tienes suficientes flotas. Disponibles: ${flotasDisponibles}` });
            return;
        }

        const GestorMovimiento = require('./clases/Gestores/GestorMovimiento');
        const gestorMovimiento = new GestorMovimiento(partida.galaxia);

        const astillerosAMover = sistemaOrigen.astillerosEstacionados.slice(0, cantidad);

        const resultado = gestorMovimiento.moverAstilleros(astillerosAMover, sistemaDestino, (evento, data) => {
            if (evento === 'sistemaConquistado') {
                io.to(idPartida).emit("planeta_conquistado", {
                    idPartida,
                    conquistadorId: jugador.socketId,
                    conquistador: jugador.nickname,
                    sistema: data.sistema
                });
            }
            if (evento === 'combateResuelto') {
                io.to(idPartida).emit("combate_resultado", {
                    idPartida,
                    sistema: data.sistema,
                    atacante: data.atacante,
                    ganador: data.ganador,
                    fuerzaAtacante: data.fuerzaAtacante,
                    fuerzaDefensor: data.fuerzaDefensor,
                    perdidasAtacante: data.perdidasAtacante,
                    perdidasDefensor: data.perdidasDefensor,
                    conquista: data.conquista
                });

                if (data.conquista) {
                    const defensor = partida.jugadores.find(j => j.nickname === data.ganador === false && j.nickname !== data.atacante);
                    partida.jugadores.forEach(j => {
                        if (j.nickname !== data.atacante) {
                            const sistemasRestantes = partida.galaxia.sistemas.filter(s => s.propietario === j).length;
                            if (sistemasRestantes === 0) {
                                io.to(idPartida).emit("jugador_eliminado", {
                                    idPartida,
                                    jugador: j.nickname
                                });
                            }
                        }
                    });
                }
            }
        });


        if (resultado.exitoso) {
            socket.emit("mover_flotas_exito", {
                mensaje: "Flotas movidas exitosamente",
                origen: sistemaOrigen.nombre,
                destino: sistemaDestino.nombre,
                cantidad
            });

            const jugadoresInfo = partida.jugadores.map(jugadorActual => ({
                id: jugadorActual.socketId,
                nombre: jugadorActual.nickname,
                recursos: jugadorActual.recursos,
                sistemasConquistados: jugadorActual.getSistemasControlados().length
            }));

            partida.jugadores.forEach(jugadorActual => {
                if (jugadorActual.socketId) {
                    io.to(jugadorActual.socketId).emit("actualizar_clientes", {
                        jugadores: jugadoresInfo,
                        galaxia: {
                            nombre: partida.galaxia.nombre,
                            sistemas: partida.galaxia.sistemas.map(sistemaPlanetario => sistemaPlanetario.toJSON()),
                            rutas: partida.galaxia.rutas.map(ruta => [ruta.origen.id, ruta.destino.id])
                        }
                    });
                }
            });

            partida.chequearVictoriaPorConquista();
        } else {
            socket.emit("mover_flotas_error", {
                mensaje: "Error al mover flotas",
                errores: resultado.errores
            });
        }
    });

    socket.on("disconnect", () => {
        jugadores.delete(socket.id);

        for (const [idPartida, partida] of partidas.entries()) {
            const estabaEnPartida = partida.jugadores.some(j => j.socketId === socket.id);
            
            if (estabaEnPartida) {
                partida.jugadores = partida.jugadores.filter(j => j.socketId !== socket.id);
                
                io.to(idPartida).emit("jugador_salio", { 
                    idPartida, 
                    jugadorId: socket.id 
                });

                if (partida.jugadores.length === 0) {
                    partidas.delete(idPartida);
                    clearInterval(partida._timerInterval);
                } else if (partida.estado === 'iniciada' && partida.jugadores.length === 1) {
                    partida.finalizarPorEliminacion();
                }
            }
        }
    });
});


app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Servidor de Colonias Galácticas funcionando",
        galaxiasDisponibles: galaxiasDisponibles.length
    });
});

app.get("/api/galaxias", (req, res) => {
    res.json(galaxiasDisponibles);
});

server.listen(3000, () => {
    console.log("Servidor ejecutándose en puerto 3000");
});