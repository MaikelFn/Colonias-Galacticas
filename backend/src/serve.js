const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const Galaxia = require('./clases/Entidades/Galaxia');
const Jugador = require('./clases/Entidades/Jugador');
const { Partida } = require('./clases/Entidades/Partida');

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
        
        console.log(`${galaxias.length} galaxias cargadas desde ${galaxiasDir}`);
        return galaxias;
    } catch (error) {
        console.error('Error al cargar galaxias:', error);
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
        console.error('Error al cargar galaxia desde archivo:', error);
        return null;
    }
}

io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    socket.on("registrar_jugador", (datos) => {
        const { nombre } = datos;
        const jugador = new Jugador(nombre, socket.id);
        jugadores.set(socket.id, jugador);
        console.log(`Jugador registrado: ${nombre} (${socket.id})`);
        socket.emit("registrar_exitoso", { id: socket.id, nombre });
    });

    socket.on("obtener_galaxias", () => {
        socket.emit("galaxias_disponibles", galaxiasDisponibles);
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
                console.log(`Partida cerrada por tiempo de espera: ${partidaCerrada.id}`);
                io.to(idPartida).emit("partida_cerrada", {
                    idPartida: partidaCerrada.id,
                    razon: "Tiempo de espera agotado. No se alcanzaron los jugadores mínimos."
                });
            }
        );

        console.log(`Tiempo de espera configurado en partida: ${partida.tiempoEsperaSeg} segundos`);

        partida.agregarJugador(jugadorCreador);
        partidas.set(idPartida, partida);

        console.log('=== PARTIDA CREADA ===');
        console.log(`Temporizador de espera iniciado: ${partida.gestorTemporizadores.temporizadorEspera ? 'SI' : 'NO'}`);
        console.log(`Tiempo de espera: ${partida.tiempoEsperaSeg} segundos`);
        console.log(`ID: ${partida.id}`);
        console.log(`Nombre: ${partida.nombre}`);
        console.log(`Galaxia: ${partida.galaxia.nombre}`);
        console.log(`Sistemas: ${partida.galaxia.sistemas.length}`);
        console.log(`Rutas: ${partida.galaxia.rutas.length}`);
        console.log(`Max Jugadores: ${partida.maxJugadores}`);
        console.log(`Duración: ${partida.duracionMaximaSeg} segundos`);
        console.log(`Dificultad Recursos: ${partida.dificultadRecursos}`);
        console.log(`Estado: ${partida.estado}`);
        console.log(`Jugadores: ${partida.jugadores.length}`);
        partida.jugadores.forEach(j => {
            console.log(`  - ${j.nickname} (${j.socketId})`);
        });
        console.log('=====================');

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

        console.log(`${nombreJugador} se unió a la partida ${idPartida}`);

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

    socket.on("disconnect", () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        jugadores.delete(socket.id);
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