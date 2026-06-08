const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');

// Cuando React llame a /registro, ejecuta la función registrar
router.post('/registro', registrar);

// Cuando React llame a /login, ejecuta la función login
router.post('/login', login);

// Ruta exclusiva para que el médico consulte la lista de pacientes reales
router.get('/pacientes', async (req, res) => {
    try {
        const db = require('../bd/connection/db');
        // Filtramos por rol = 'usuario' para que no salgan los administradores ni otros médicos
        const [rows] = await db.execute("SELECT id_usuario, nombre, apellidoP, apellidoM, correo FROM USUARIO WHERE rol = 'usuario'");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar los pacientes en la base de datos.' });
    }
});
module.exports = router;