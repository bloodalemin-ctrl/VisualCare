const Usuario = require('../models/Usuario');

const registrar = async (req, res) => {
    const { nombre, apellidoP, apellidoM, correo, password } = req.body;
    
    if (!nombre || !apellidoP || !apellidoM || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        await Usuario.crear(nombre, apellidoP, apellidoM, correo, password);
        res.status(201).json({ message: 'Registro exitoso.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El correo ya está registrado.' });
        }
        res.status(500).json({ error: 'Error del servidor al registrar.' });
    }
};

const login = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const usuario = await Usuario.buscarPorCorreo(correo);
        
        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado.' });
        
        // Comparación de texto plano
        if (password !== usuario.password) {
            return res.status(400).json({ error: 'Contraseña incorrecta.' });
        }

        // Si todo está bien, mandamos los datos
        res.json({
            message: 'Acceso concedido',
            usuario: { 
                id: usuario.id_usuario, 
                nombre: usuario.nombre, 
                apellidoP: usuario.apellidoP, 
                correo: usuario.correo,
                rol: usuario.rol,
                cedula: usuario.cedula 
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor.' });
    }
};

module.exports = { registrar, login };