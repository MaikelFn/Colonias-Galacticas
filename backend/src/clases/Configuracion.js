const fs = require('fs');
const path = require('path');

class Configuracion {
    constructor() {
        const data = fs.readFileSync(path.join(__dirname, '..', 'data', 'Configuracion.json'), 'utf8');
        this.valores = JSON.parse(data);
    }

    get(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.valores);
    }
}

module.exports = new Configuracion();