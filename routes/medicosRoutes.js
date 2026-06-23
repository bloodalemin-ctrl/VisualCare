const express = require('express');
const router = express.Router();
const medicosController = require('../controllers/medicosController');

// Ruta GET para obtener la lista de médicos
router.get('/', medicosController.obtenerMedicos);

// Más adelante agregaremos aquí las de POST (crear), PUT (editar) y DELETE (eliminar)

module.exports = router;