const Cvsq = require('../models/Cvsq');
const nombresSintomas = [
    "Ardor ocular", "Picor o comezón", "Sensación de arenilla", "Lagrimeo", "Parpadeo excesivo",
    "Enrojecimiento ocular", "Dolor ocular", "Pesadez en los párpados", "Sequedad ocular", 
    "Visión borrosa", "Visión doble", "Dificultad para enfocar", 
    "Sensibilidad a la luz", "Halos de colores", "Empeoramiento visual", "Dolor de cabeza"
];

const guardarTest = async (req, res) => {
    const { id_usuario, listaSintomas } = req.body;
    try {
        let puntaje_total = 0;
        listaSintomas.forEach(s => { puntaje_total += (s.frecuencia * s.intensidad); });
        
        let nivel_fatiga = 'Normal (Verde)';
        if (puntaje_total >= 7 && puntaje_total <= 13) nivel_fatiga = 'Riesgo Medio (Amarillo)';
        else if (puntaje_total >= 14) nivel_fatiga = 'Alto Riesgo (Rojo)';
        
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const id_cvs = await Cvsq.guardarCuestionario(id_usuario, puntaje_total, nivel_fatiga, fechaActual);
        
        for (let i = 0; i < listaSintomas.length; i++) {
            await Cvsq.guardarSintoma(id_cvs, nombresSintomas[i], listaSintomas[i].frecuencia, listaSintomas[i].intensidad);
        }
        res.status(201).json({ message: 'Guardado con éxito', puntaje_total, nivel_fatiga });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fallo al insertar CVSQ' });
    }
};
module.exports = { guardarTest };