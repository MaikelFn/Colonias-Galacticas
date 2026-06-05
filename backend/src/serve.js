const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

// ─── Cargar galaxias desde el directorio ─────────────────────

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

// ─── Socket.IO ──────────────────────────────────────────────

io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // ── Obtener galaxias disponibles ─────────────────────────
    socket.on("obtener_galaxias", () => {
        socket.emit("galaxias_disponibles", galaxiasDisponibles);
    });

    socket.on("disconnect", () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

// ─── REST endpoints ─────────────────────────────────────────

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