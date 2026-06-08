const db = require('../bd/connection/db');

const Usuario = {
    // Función para guardar en la BD
    crear: async (nombre, apellidoP, apellidoM, correo, password) => {
        const sql = 'INSERT INTO USUARIO (nombre, apellidoP, apellidoM, correo, password, rol) VALUES (?, ?, ?, ?, ?, "usuario")';
        return await db.execute(sql, [nombre, apellidoP, apellidoM, correo, password]);
    },
    
    // Función para buscar a alguien por su correo
    buscarPorCorreo: async (correo) => {
        const [rows] = await db.execute('SELECT * FROM USUARIO WHERE correo = ?', [correo]);
        return rows[0]; // Devuelve los datos de esa persona
    }
};

module.exports = Usuario;