const db = require('../bd/connection/db');
module.exports = {
    registrarLectura: async (id_usuario, distancia_cm, fecha) => {
        return await db.execute('INSERT INTO DISTANCIA (id_usuario, distancia_cm, fecha) VALUES (?, ?, ?)', [id_usuario, distancia_cm, fecha]);
    }
};