const { MongoClient } = require("mongodb")

const uri = process.env.MONGODB_URI

let clientPromise

if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
        global._mongoClientPromise = new MongoClient(uri).connect()
    }
    clientPromise = global._mongoClientPromise
} else {
    clientPromise = new MongoClient(uri).connect()
}

/**
 * Obtiene la instancia de la base de datos MongoDB
 * @returns {Promise<Db>} Instancia de la base de datos "colonias-galacticas"
 */
async function getDb() {
    const client = await clientPromise
    return client.db("colonias-galacticas")
}

module.exports = { getDb }