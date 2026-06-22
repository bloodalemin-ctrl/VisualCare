const express = require('express');
const router = express.Router();
const { guardarDistancia } = require('../controllers/distanciaController');
router.post('/registrar-distancia', guardarDistancia);
module.exports = router;