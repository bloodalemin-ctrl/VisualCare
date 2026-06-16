const db = require('../bd/connection/db');

const Cvsq = {
    guardarCuestionario: async (id_usuario, puntaje_total, nivel_fatiga, fecha) => {
        const sql = 'INSERT INTO CUESTIONARIO_CVS (id_usuario, puntaje_total, nivel_fatiga, fecha) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(sql, [id_usuario, puntaje_total, nivel_fatiga, fecha]);
        return result.insertId;
    },
    guardarSintoma: async (id_cvs, nombre_sintoma, frecuencia, intensidad) => {
        const sql = 'INSERT INTO SINTOMAS_CVS (id_cvs, nombre_sintoma, frecuencia, intensidad) VALUES (?, ?, ?, ?)';
        return await db.execute(sql, [id_cvs, nombre_sintoma, frecuencia, intensidad]);
    }
};
module.exports = Cvsq;