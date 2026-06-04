const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

const partidas = new Map();
const jugadores = new Map();

// Temporizadores de cierre automático (RF-04)
const temporizadoresCierre = new Map();
// Intervalos de cuenta regresiva de inicio (RF-07)
const cuentasRegresivas = new Map();

const TIEMPO_ESPERA_SALA_SEG = 120;
const MIN_JUGADORES = 2;           

// ─── Helpers ────────────────────────────────────────────────

/**
 * Inicia el temporizador de cierre automático para una partida.
 * Si no alcanza MIN_JUGADORES en TIEMPO_ESPERA_SALA_SEG segundos, la cierra.
 */
function iniciarTemporizadorCierre(idPartida) {
    if (temporizadoresCierre.has(idPartida)) return;

    let segundosRestantes = TIEMPO_ESPERA_SALA_SEG;

    const intervalo = setInterval(() => {
        segundosRestantes--;

        const partida = partidas.get(idPartida);
        if (!partida || partida.estado !== "esperando") {
            clearInterval(intervalo);
            temporizadoresCierre.delete(idPartida);
            return;
        }

        io.to(idPartida).emit("temporizador_espera", {
            idPartida,
            segundosRestantes
        });

        if (segundosRestantes <= 0) {
            clearInterval(intervalo);
            temporizadoresCierre.delete(idPartida);

            if (partida.jugadores.length < MIN_JUGADORES) {
                partida.estado = "cerrada";
                partidas.set(idPartida, partida);
                io.to(idPartida).emit("partida_cerrada", {
                    idPartida,
                    razon: `Tiempo de espera agotado. No se alcanzaron los ${MIN_JUGADORES} jugadores mínimos.`
                });
                io.emit("actualizar_partidas", Array.from(partidas.values()));
                console.log(`Partida cerrada por inactividad: ${idPartida}`);
            }
        }
    }, 1000);

    temporizadoresCierre.set(idPartida, intervalo);
}

/**
 * Cancela el temporizador de cierre (cuando la sala se llena).
 */
function cancelarTemporizadorCierre(idPartida) {
    const intervalo = temporizadoresCierre.get(idPartida);
    if (intervalo) {
        clearInterval(intervalo);
        temporizadoresCierre.delete(idPartida);
    }
}

/**
 * Inicia la cuenta regresiva de 3 segundos antes de comenzar el juego (RF-07).
 */
function iniciarCuentaRegresiva(idPartida) {
    if (cuentasRegresivas.has(idPartida)) return;

    let cuenta = 3;

    io.to(idPartida).emit("cuenta_regresiva", { idPartida, cuenta });

    const intervalo = setInterval(() => {
        cuenta--;
        io.to(idPartida).emit("cuenta_regresiva", { idPartida, cuenta });

        if (cuenta <= 0) {
            clearInterval(intervalo);
            cuentasRegresivas.delete(idPartida);

            const partida = partidas.get(idPartida);
            if (partida) {
                partida.estado = "en_curso";
                partidas.set(idPartida, partida);
                io.emit("actualizar_partidas", Array.from(partidas.values()));
                console.log(`Partida iniciada: ${idPartida}`);
            }
        }
    }, 1000);

    cuentasRegresivas.set(idPartida, intervalo);
}

// ─── Socket.IO ──────────────────────────────────────────────

io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // ── Registrar jugador ────────────────────────────────────
    socket.on("registrar_jugador", (datos) => {
        const { nombre } = datos;
        jugadores.set(socket.id, { id: socket.id, nombre, conectado: true });
        console.log(`Jugador registrado: ${nombre} (${socket.id})`);
        socket.emit("registrar_exitoso", { id: socket.id, nombre });
        io.emit("actualizar_jugadores", Array.from(jugadores.values()));
    });

    // ── Crear partida ────────────────────────────────────────
    socket.on("crear_partida", (datos) => {
        const { nombre, galaxia, maxJugadores, duracion, recursos, comandante } = datos;
        const idPartida = `partida_${Date.now()}`;

        const partida = {
            id: idPartida,
            nombre,
            galaxia,
            maxJugadores,
            duracion,
            recursos,
            comandante,
            creador: socket.id,
            jugadores: [{ id: socket.id, nombre: comandante }],
            estado: "esperando",
            fechaCreacion: new Date()
        };

        partidas.set(idPartida, partida);
        console.log(`🎮 Partida creada: ${nombre} (${idPartida})`);

        socket.join(idPartida);
        socket.emit("partida_creada", partida);
        io.emit("actualizar_partidas", Array.from(partidas.values()));

        // Iniciar temporizador de cierre automático (RF-04)
        iniciarTemporizadorCierre(idPartida);
    });

    socket.on("obtener_partidas", () => {
        const disponibles = Array.from(partidas.values()).filter(p =>
            p.jugadores.length < p.maxJugadores && p.estado === "esperando"
        );
        socket.emit("partidas_disponibles", disponibles);
    });

    socket.on("unirse_partida", (datos) => {
        const { idPartida, nombreJugador } = datos;
        const partida = partidas.get(idPartida);

        if (!partida) {
            socket.emit("error_unirse", { mensaje: "La partida no existe." });
            return;
        }
        if (partida.estado !== "esperando") {
            socket.emit("error_unirse", { mensaje: "La partida ya no está disponible." });
            return;
        }
        if (partida.jugadores.length >= partida.maxJugadores) {
            socket.emit("error_unirse", { mensaje: "La partida ya está llena." });
            return;
        }

        const nuevoJugador = { id: socket.id, nombre: nombreJugador };
        partida.jugadores.push(nuevoJugador);
        socket.join(idPartida);

        console.log(`${nombreJugador} se unió a la partida ${idPartida}`);

        io.to(idPartida).emit("jugador_unido", {
            idPartida,
            jugador: nuevoJugador,
            totalJugadores: partida.jugadores.length
        });
        io.emit("actualizar_partidas", Array.from(partidas.values()));

        // Si la sala se llenó, cancelar temporizador de cierre (RF-04 / RF-07)
        if (partida.jugadores.length >= partida.maxJugadores) {
            cancelarTemporizadorCierre(idPartida);
            io.to(idPartida).emit("sala_llena", { idPartida });
            console.log(`Sala llena: ${idPartida} — esperando señal de inicio`);
        }
    });

    // ── Iniciar partida (señal del jugador, RF-07) ────────────
    socket.on("iniciar_partida", (datos) => {
        const { idPartida } = datos;
        const partida = partidas.get(idPartida);

        if (!partida) return;
        if (partida.estado !== "esperando") return;
        if (partida.jugadores.length < partida.maxJugadores) {
            socket.emit("error_inicio", { mensaje: "Aún no está la sala completa." });
            return;
        }

        console.log(`▶ Inicio solicitado para partida ${idPartida} por ${socket.id}`);
        iniciarCuentaRegresiva(idPartida);
    });

    // ── Salir de sala de espera ──────────────────────────────
    socket.on("salir_sala", (datos) => {
        const { idPartida, nombreJugador } = datos;
        const partida = partidas.get(idPartida);

        if (partida && partida.estado === "esperando") {
            partida.jugadores = partida.jugadores.filter(j => j.id !== socket.id);
            socket.leave(idPartida);

            io.to(idPartida).emit("jugador_salio", {
                idPartida,
                jugadorId: socket.id,
                nombreJugador
            });

            io.emit("actualizar_partidas", Array.from(partidas.values()));
            console.log(`${nombreJugador} salió de la sala ${idPartida}`);

            if (partida.jugadores.length === 0) {
                partida.estado = "cerrada";
                cancelarTemporizadorCierre(idPartida);
                partidas.set(idPartida, partida);
                io.emit("actualizar_partidas", Array.from(partidas.values()));
                console.log(`Sala vacía cerrada: ${idPartida}`);
            }
        }
    });

    // ── Chat de partida ──────────────────────────────────────
    socket.on("chat_mensaje", (datos) => {
        const { idPartida, nombreJugador, mensaje } = datos;
        const msgData = {
            nombreJugador,
            mensaje,
            timestamp: new Date().toISOString()
        };
        if (idPartida) {
            io.to(idPartida).emit("chat_mensaje", msgData);
        } else {
            io.emit("chat_mensaje", msgData);
        }
    });

    // ── Obtener ranking ──────────────────────────────────────
    socket.on("obtener_ranking", () => {
        const ranking = [
            { posicion: 1, jugador: "AlphaCommander", puntos: 5420 },
            { posicion: 2, jugador: "VoidWalker",     puntos: 4890 },
            { posicion: 3, jugador: "StarSeeker",     puntos: 4320 }
        ];
        socket.emit("ranking_disponible", ranking);
    });

    // ── Desconexión ──────────────────────────────────────────
    socket.on("disconnect", () => {
        const jugador = jugadores.get(socket.id);
        if (jugador) {
            console.log(`Cliente desconectado: ${jugador.nombre} (${socket.id})`);
            jugadores.delete(socket.id);
            io.emit("actualizar_jugadores", Array.from(jugadores.values()));
        } else {
            console.log(`Cliente desconectado: ${socket.id}`);
        }

        // Limpiar al jugador de cualquier partida en espera
        partidas.forEach((partida, idPartida) => {
            if (partida.estado === "esperando") {
                const idx = partida.jugadores.findIndex(j => j.id === socket.id);
                if (idx !== -1) {
                    const nombreJugador = partida.jugadores[idx].nombre;
                    partida.jugadores.splice(idx, 1);
                    io.to(idPartida).emit("jugador_salio", {
                        idPartida,
                        jugadorId: socket.id,
                        nombreJugador
                    });
                    io.emit("actualizar_partidas", Array.from(partidas.values()));

                    if (partida.jugadores.length === 0) {
                        partida.estado = "cerrada";
                        cancelarTemporizadorCierre(idPartida);
                        partidas.set(idPartida, partida);
                        io.emit("actualizar_partidas", Array.from(partidas.values()));
                    }
                }
            }
        });
    });
});

// ─── REST endpoints ─────────────────────────────────────────

app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Servidor de Colonias Galácticas funcionando",
        partidasActivas: partidas.size,
        jugadoresConectados: jugadores.size
    });
});

app.get("/api/partidas", (req, res) => {
    res.json(Array.from(partidas.values()));
});

app.get("/api/jugadores", (req, res) => {
    res.json(Array.from(jugadores.values()));
});

server.listen(3000, () => {
    console.log("Servidor ejecutándose en puerto 3000");
});