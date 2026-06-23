// Importamos la conexión a tu base de datos (ajusta la ruta si es diferente)
const db = require('../bd/connection/db.js');

// Función para OBTENER todos los médicos (Read)
const obtenerMedicos = (req, res) => {
    // Aquí pondremos el SELECT de SQL
    const sql = 'SELECT * FROM medicos'; // <--- Cambiaremos esto por tu tabla real
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener médicos:', err);
            return res.status(500).json({ mensaje: 'Error en el servidor' });
        }
        res.status(200).json(result);
    });
};

// Exportamos las funciones para usarlas en las rutas
module.exports = {
    obtenerMedicos
};