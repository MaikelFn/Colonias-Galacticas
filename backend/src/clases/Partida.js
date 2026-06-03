class Partida {

    constructor(id) {
        this.id = id;
        this.jugadores = [];
        this.estado = "esperando";
    }

    agregarJugador(jugador) {
        this.jugadores.push(jugador);
    }

}

module.exports = Partida;