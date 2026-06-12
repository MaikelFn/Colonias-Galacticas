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
const GestorMovimiento = require('./clases/Gestores/GestorMovimiento');
const { validarPartidaExiste, validarJugadorEnPartida, validarSistemaExiste, validarPropietarioSistema, validarFlotasSuficientes, validarEstadoPartida, validarPartidaNoLlena, validarNombreJugadorUnico, validarJugadorRegistrado, validarNombrePartidaUnico, validarGalaxiaCargada, validarJugadoresMinimos } = require('./utils/validaciones');
const { crearInfoJugadores, crearInfoGalaxia, enviarActualizacionClientes, crearInfoPartida, crearInfoJugadoresIniciada, crearInfoGalaxiaIniciada, limpiarTimerPartida } = require('./utils/helpers');

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


function eliminarJugadorDePartida(partida, socketId, io, idPartida) {
    partida.jugadores = partida.jugadores.filter(jugador => jugador.socketId !== socketId);
    io.to(idPartida).emit("jugador_salio", { idPartida, jugadorId: socketId });
    
    if (partida.jugadores.length === 0) {
        partidas.delete(idPartida);
        limpiarTimerPartida(partida);
    } else if (partida.estado === 'iniciada' && partida.jugadores.length === 1) {
        partida.finalizarPorEliminacion();
    }
}

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
                
                const sistemasCount = galaxia.sistemas ? galaxia.sistemas.length : 0;
                const rutasCount = galaxia.rutas ? galaxia.rutas.length : 0;
                
                if (sistemasCount >= 25 && rutasCount >= 40) {
                    galaxias.push({
                        id: archivo.replace('.json', ''),
                        nombre: galaxia.nombre,
                        sistemas: galaxia.sistemas,
                        rutas: galaxia.rutas
                    });
                }
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
        socket.emit("configuracion_recursos", configuracion?.juego?.recursosIniciales || {});
    });

    socket.on("obtener_partidas", () => {
        const disponibles = Array.from(partidas.values()).filter(partida =>
            partida.estado === 'esperando' && partida.jugadores.length < partida.maxJugadores
        );
        const partidasInfo = disponibles.map(partida => ({
            id: partida.id,
            nombre: partida.nombre,
            galaxia: partida.galaxia.nombre,
            maxJugadores: partida.maxJugadores,
            duracion: Math.floor(partida.duracionMaximaSeg / 60),
            recursos: partida.dificultadRecursos,
            estado: partida.estado,
            jugadores: partida.jugadores.map(jugador => ({ id: jugador.socketId, nombre: jugador.nickname }))
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

        if (!validarNombrePartidaUnico(partidas, nombre, socket, "error_crear_partida")) return;

        const galaxia = cargarGalaxiaDesdeArchivo(galaxiaId);
        if (!validarGalaxiaCargada(galaxia, socket, "error_crear_partida")) return;

        const jugadorCreador = validarJugadorRegistrado(jugadores, socket.id, socket, "error_crear_partida");
        if (!jugadorCreador) return;

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
                    razon: "Tiempo de espera agotado. No se alcanzaron los jugadores mínimos.",
                    mensaje: "La partida se cerró porque se agotó el tiempo de espera de la sala"
                });
                partidas.delete(idPartida);
            },
            (partida) => {
                const jugadoresInfo = crearInfoJugadores(partida.jugadores);
                enviarActualizacionClientes(io, partida, jugadoresInfo, crearInfoGalaxia);
            },
            io,
            async (datosFinales) => {
                try {
                    await guardarPartidaEnRanking(datosFinales);
                } catch (error) {
                }
            },
            (idPartidaADestruir) => {
                const partida = partidas.get(idPartidaADestruir);
                if (partida) {
                    limpiarTimerPartida(partida);
                }
                partidas.delete(idPartidaADestruir);
            }
        );


        partida.agregarJugador(jugadorCreador);
        partidas.set(idPartida, partida);


        socket.join(idPartida);
        socket.emit("partida_creada", crearInfoPartida(partida, duracion));
    });

    socket.on("unirse_partida", (datos) => {
        const { idPartida, nombreJugador } = datos;
        const partida = partidas.get(idPartida);

        if (!validarPartidaExiste(partida, socket, "error_unirse")) return;
        if (!validarEstadoPartida(partida, 'esperando', socket, "error_unirse")) return;
        if (!validarPartidaNoLlena(partida, socket, "error_unirse")) return;
        if (!validarNombreJugadorUnico(partida, nombreJugador, socket, "error_unirse")) return;

        const jugadorUnirse = validarJugadorRegistrado(jugadores, socket.id, socket, "error_unirse");
        if (!jugadorUnirse) return;

        partida.agregarJugador(jugadorUnirse);
        socket.join(idPartida);


        io.to(idPartida).emit("jugador_unido", {
            idPartida,
            jugador: { id: socket.id, nombre: nombreJugador },
            totalJugadores: partida.jugadores.length
        });

        socket.emit("partida_unida", crearInfoPartida(partida));
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
            socket.leave(idPartida);
            eliminarJugadorDePartida(partida, socket.id, io, idPartida);
        }
    });

    socket.on("iniciar_partida", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);

        if (!validarPartidaExiste(partida, socket, "error_inicio")) return;
        if (!validarEstadoPartida(partida, 'esperando', socket, "error_inicio")) return;
        if (!validarJugadoresMinimos(partida, socket, "error_inicio")) return;

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

                    partida.timerInterval = setInterval(() => {
                        const transcurrido = Date.now() - inicioMs;
                        const restanteSeg = Math.max(0, Math.ceil((duracionMs - transcurrido) / 1000));
                        io.to(idPartida).emit('tick_timer', { segsRestantes: restanteSeg });
                        if (restanteSeg <= 0) clearInterval(partida.timerInterval);
                    }, 1000);

                    io.to(idPartida).emit('partida_iniciada', {
                        idPartida: partida.id,
                        estado: partida.estado,
                        jugadores: crearInfoJugadoresIniciada(partida),
                        galaxia: crearInfoGalaxiaIniciada(partida)
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
            eliminarJugadorDePartida(partida, socket.id, io, idPartida);
        }
    });

    socket.on("construccion", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);

        if (!validarPartidaExiste(partida, socket, "construccion_error")) return;

        const gestor = new GestorConstruccion(partida);
        const resultado = gestor.construir(datos, socket.id);

        if (resultado.success) {
            socket.emit("construccion_exito", {
                mensaje: resultado.mensaje,
                construccion: resultado.construccion,
                sistema: resultado.sistema,
                recursosRestantes: resultado.recursosRestantes
            });

            const jugadoresInfo = crearInfoJugadores(partida.jugadores);
            enviarActualizacionClientes(io, partida, jugadoresInfo, crearInfoGalaxia);
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

        if (!validarPartidaExiste(partida, socket, "mover_flotas_error")) return;

        const jugador = validarJugadorEnPartida(partida, socket.id, socket, "mover_flotas_error");
        if (!jugador) return;

        const sistemaOrigen = partida.galaxia.sistemas.find(s => s.id === idSistemaOrigen);
        const sistemaDestino = partida.galaxia.sistemas.find(s => s.id === idSistemaDestino);

        if (!validarSistemaExiste(sistemaOrigen, socket, "mover_flotas_error")) return;
        if (!validarSistemaExiste(sistemaDestino, socket, "mover_flotas_error")) return;

        if (!validarPropietarioSistema(sistemaOrigen, jugador, socket, "mover_flotas_error")) return;

        const flotasDisponibles = sistemaOrigen.obtenerCantidadAstilleros();
        if (!validarFlotasSuficientes(flotasDisponibles, cantidad, socket, "mover_flotas_error")) return;

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
                    const defensor = partida.jugadores.find(jugador => jugador.nickname === data.ganador === false && jugador.nickname !== data.atacante);
                    partida.jugadores.forEach(jugador => {
                        if (jugador.nickname !== data.atacante) {
                            const sistemasRestantes = partida.galaxia.sistemas.filter(sistema => sistema.propietario === jugador).length;
                            if (sistemasRestantes === 0) {
                                io.to(idPartida).emit("jugador_eliminado", {
                                    idPartida,
                                    jugador: jugador.nickname
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

            const jugadoresInfo = crearInfoJugadores(partida.jugadores);
            enviarActualizacionClientes(io, partida, jugadoresInfo, crearInfoGalaxia);

            partida.chequearVictoriaPorConquista();
        } else {
            socket.emit("mover_flotas_error", {
                mensaje: "Error al mover flotas",
            });
        }
    });

    socket.on("disconnect", () => {
        jugadores.delete(socket.id);

        for (const [idPartida, partida] of partidas.entries()) {
            const estabaEnPartida = partida.jugadores.some(jugador => jugador.socketId === socket.id);
            
            if (estabaEnPartida) {
                eliminarJugadorDePartida(partida, socket.id, io, idPartida);
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