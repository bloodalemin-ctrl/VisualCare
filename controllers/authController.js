const Usuario = require('../models/Usuario');

const registrar = async (req, res) => {
    // LOG PARA VER QUÉ LLEGA
    console.log("=".repeat(50));
    console.log("📥 Body recibido:", req.body);
    console.log("=".repeat(50));
    
    const { nombre, apellidoP, apellidoM, correo, password, fechaNacimiento } = req.body;
    

const registrar = async (req, res) => {
    const { nombre, apellidoP, apellidoM, correo, password, fechaNacimiento } = req.body;
    
    // Validación de campos obligatorios
    if (!nombre || !apellidoP || !apellidoM || !correo || !password || !fechaNacimiento) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validación del formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!fechaRegex.test(fechaNacimiento)) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    // Validación: que no sea una fecha futura
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    
    // Resetear horas para comparar solo fechas
    hoy.setHours(0, 0, 0, 0);
    fechaNac.setHours(0, 0, 0, 0);
    
    if (fechaNac > hoy) {
        return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
    }

    // Validación: edad mínima (5 años)
    const edadMinima = 5;
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    if (edad < edadMinima) {
        return res.status(400).json({ error: `Debes tener al menos ${edadMinima} años para registrarte` });
    }

    // Validación: edad máxima (opcional - 120 años)
    const edadMaxima = 120;
    if (edad > edadMaxima) {
        return res.status(400).json({ error: `La edad ingresada parece no ser válida (máximo ${edadMaxima} años)` });
    }

    // Validación de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
    }

    // Validación de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // Intentar crear el usuario con fecha de nacimiento
        const resultado = await Usuario.crear(nombre, apellidoP, apellidoM, correo, password, fechaNacimiento);
        
        console.log("✅ Usuario registrado exitosamente:", { 
            nombre, 
            apellidoP, 
            apellidoM, 
            correo, 
            fechaNacimiento,
            edad: edad 
        });
        
        res.status(201).json({ 
            message: 'Registro exitoso. Por favor inicia sesión.',
            usuario: {
                nombre: `${nombre} ${apellidoP} ${apellidoM}`,
                correo: correo,
                edad: edad
            }
        });
    } catch (error) {
        console.error("❌ Error en registro:", error);
        
        // Manejo específico de errores de MySQL
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado. Por favor usa otro o inicia sesión.' });
        }
        
        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ error: 'Faltan campos obligatorios en la base de datos.' });
        }
        
        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({ error: 'Uno o más campos exceden la longitud permitida.' });
        }
        
        res.status(500).json({ error: 'Error del servidor al registrar. Por favor intenta más tarde.' });
    }
};

const login = async (req, res) => {
    // Log de lo que llega desde React
    console.log("📝 Datos que llegaron desde React:", req.body);
    
    const { correo, password } = req.body;
    
    console.log("🔍 Correo extraído para buscar en MySQL:", correo);

    // Validaciones básicas
    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    try {
        const usuario = await Usuario.buscarPorCorreo(correo);
        
        if (!usuario) {
            console.log("❌ Usuario no encontrado:", correo);
            return res.status(401).json({ error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
        }
        
        // Comparación de texto plano (en producción debería ser con hash)
        if (password !== usuario.password) {
            console.log("❌ Contraseña incorrecta para usuario:", correo);
            return res.status(401).json({ error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
        }

        // Calcular edad para enviar al frontend
        let edad = null;
        if (usuario.fecha_nacimiento) {
            const fechaNac = new Date(usuario.fecha_nacimiento);
            const hoy = new Date();
            edad = hoy.getFullYear() - fechaNac.getFullYear();
            const mes = hoy.getMonth() - fechaNac.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
        }

        // Login exitoso
        console.log("✅ Login exitoso para usuario:", correo, "Rol:", usuario.rol);
        
        // Si todo está bien, mandamos los datos del usuario
        res.json({
            message: 'Acceso concedido',
            usuario: { 
                id: usuario.id_usuario, 
                nombre: usuario.nombre, 
                apellidoP: usuario.apellidoP, 
                apellidoM: usuario.apellidoM,
                correo: usuario.correo,
                rol: usuario.rol,
                cedula: usuario.cedula || null,
                fechaNacimiento: usuario.fecha_nacimiento,
                edad: edad // Enviamos la edad calculada
            }
        });
    } catch (error) {
        console.error("❌ Error en login:", error); 
        res.status(500).json({ error: 'Error del servidor al iniciar sesión. Por favor intenta más tarde.' });
    }
};

// Función adicional para obtener la edad de un usuario específico
const obtenerEdadUsuario = async (req, res) => {
    const { idUsuario } = req.params;
    
    try {
        const edad = await Usuario.obtenerEdad(idUsuario);
        
        if (edad === null) {
            return res.status(404).json({ error: 'Usuario no encontrado o sin fecha de nacimiento' });
        }
        
        res.json({ 
            id: idUsuario, 
            edad: edad,
            fecha_nacimiento: await Usuario.obtenerFechaNacimiento(idUsuario)
        });
    } catch (error) {
        console.error("❌ Error al obtener edad:", error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Función adicional para actualizar fecha de nacimiento
const actualizarFechaNacimiento = async (req, res) => {
    const { idUsuario } = req.params;
    const { fechaNacimiento } = req.body;
    
    if (!fechaNacimiento) {
        return res.status(400).json({ error: 'La fecha de nacimiento es obligatoria' });
    }
    
    // Validaciones de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fechaNacimiento)) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }
    
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaNac.setHours(0, 0, 0, 0);
    
    if (fechaNac > hoy) {
        return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
    }
    
    try {
        await Usuario.actualizarFechaNacimiento(idUsuario, fechaNacimiento);
        res.json({ message: 'Fecha de nacimiento actualizada exitosamente' });
    } catch (error) {
        console.error("❌ Error al actualizar fecha:", error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { 
    registrar, 
    login, 
    obtenerEdadUsuario, 
    actualizarFechaNacimiento 
};
};