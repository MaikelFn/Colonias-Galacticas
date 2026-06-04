const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Almacenamiento temporal de partidas (en producción usar base de datos)
const partidas = new Map();
const jugadores = new Map();

io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Evento: Jugador se registra
    socket.on("registrar_jugador", (datos) => {
        const { nombre } = datos;
        jugadores.set(socket.id, {
            id: socket.id,
            nombre,
            conectado: true
        });
        console.log(`Jugador registrado: ${nombre} (${socket.id})`);
        socket.emit("registrar_exitoso", { id: socket.id, nombre });
        io.emit("actualizar_jugadores", Array.from(jugadores.values()));
    });

    // Evento: Crear partida
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
        
        socket.emit("partida_creada", partida);
        io.emit("actualizar_partidas", Array.from(partidas.values()));
    });

    // Evento: Obtener partidas disponibles
    socket.on("obtener_partidas", () => {
        const partidasDisponibles = Array.from(partidas.values()).filter(p => 
            p.jugadores.length < p.maxJugadores && p.estado === "esperando"
        );
        socket.emit("partidas_disponibles", partidasDisponibles);
        console.log(`Se enviaron ${partidasDisponibles.length} partidas disponibles`);
    });

    // Evento: Unirse a partida
    socket.on("unirse_partida", (datos) => {
        const { idPartida, nombreJugador } = datos;
        const partida = partidas.get(idPartida);

        if (partida && partida.jugadores.length < partida.maxJugadores) {
            partida.jugadores.push({
                id: socket.id,
                nombre: nombreJugador
            });
            
            socket.join(idPartida);
            console.log(`${nombreJugador} se unió a la partida ${idPartida}`);
            
            io.to(idPartida).emit("jugador_unido", {
                idPartida,
                jugador: { id: socket.id, nombre: nombreJugador },
                totalJugadores: partida.jugadores.length
            });
            
            io.emit("actualizar_partidas", Array.from(partidas.values()));
        } else {
            socket.emit("error_unirse", { mensaje: "No se puede unir a esta partida" });
        }
    });

    // Evento: Obtener ranking
    socket.on("obtener_ranking", () => {
        // Placeholder: En producción, obtendría de base de datos
        const ranking = [
            { posicion: 1, jugador: "AlphaCommander", puntos: 5420 },
            { posicion: 2, jugador: "VoidWalker", puntos: 4890 },
            { posicion: 3, jugador: "StarSeeker", puntos: 4320 }
        ];
        socket.emit("ranking_disponible", ranking);
    });

    socket.on("disconnect", () => {
        const jugador = jugadores.get(socket.id);
        if (jugador) {
            console.log(`Cliente desconectado: ${jugador.nombre} (${socket.id})`);
            jugadores.delete(socket.id);
            io.emit("actualizar_jugadores", Array.from(jugadores.values()));
        } else {
            console.log(`Cliente desconectado: ${socket.id}`);
        }
    });
});

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