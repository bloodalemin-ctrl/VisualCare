// controllers/distanciaController.js
const Distancia = require('../models/Distancia');
module.exports = {
    guardarDistancia: async (req, res) => {
        try {
            const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await Distancia.registrarLectura(req.body.id_usuario, req.body.distancia_cm, fechaActual);
            res.status(201).json({ message: 'Telemetría guardada' });
        } catch (error) { res.status(500).json({ error: 'Error en BD' }); }
    }
};