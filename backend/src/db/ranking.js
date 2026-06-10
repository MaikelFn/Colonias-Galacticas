const { getDb } = require('./mongodb')

async function guardarPartidaEnRanking(datosPartida) {
    const db = await getDb()

    const entrada = {
        idPartida:           datosPartida.idPartida,
        nombreGanador:       datosPartida.ganador,
        sistemasControlados: datosPartida.ranking[0]?.sistemasConquistados ?? 0,
        recursosAcumulados:  datosPartida.ranking[0]?.recursos ?? {},
        galaxia:             datosPartida.galaxia,
        tiempoPartida:       datosPartida.tiempoJuego,
        fecha:               new Date().toISOString()
    }

    await db.collection('ranking').insertOne(entrada)
    return entrada
}

async function obtenerRanking() {
    const db = await getDb()

    const docs = await db.collection('ranking')
        .find({})
        .sort({ fecha: -1 })
        .toArray()

    return docs.map(({ _id, ...rest }) => rest)
}

module.exports = { guardarPartidaEnRanking, obtenerRanking }