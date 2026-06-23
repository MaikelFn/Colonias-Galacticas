const { getDb } = require('./mongodb')

/**
 * Guarda los datos de una partida finalizada en el ranking
 * @param {Object} datosPartida - Datos de la partida a guardar
 * @param {string} datosPartida.idPartida - ID de la partida
 * @param {string} datosPartida.ganador - Nombre del ganador
 * @param {Array} datosPartida.ranking - Array con el ranking de jugadores
 * @param {string} datosPartida.galaxia - Nombre de la galaxia
 * @param {number} datosPartida.tiempoJuego - Tiempo de juego en segundos
 * @returns {Promise<Object>} Datos de la entrada guardada en el ranking
 */
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

/**
 * Obtiene el ranking de partidas ordenado por fecha (más recientes primero)
 * @returns {Promise<Array>} Array con las entradas del ranking sin el campo _id
 */
async function obtenerRanking() {
    const db = await getDb()

    const docs = await db.collection('ranking')
        .find({})
        .sort({ fecha: -1 })
        .toArray()

    return docs.map(({ _id, ...rest }) => rest)
}

module.exports = { guardarPartidaEnRanking, obtenerRanking }