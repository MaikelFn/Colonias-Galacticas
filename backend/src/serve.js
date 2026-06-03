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

io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
});

app.get("/", (req, res) => {
    res.json({
        status: "SI FUNCA",
        message: "AWACATE"
    });
});

server.listen(3000, () => {
    console.log("Servidor ejecutándose en puerto 3000");
});