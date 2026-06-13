const db = require('../bd/connection/db');

const Usuario = {
    // Función para guardar en la BD (CORREGIDO con fecha_nacimiento)
    crear: async (nombre, apellidoP, apellidoM, correo, password, fechaNacimiento) => {
        const sql = 'INSERT INTO USUARIO (nombre, apellidoP, apellidoM, correo, password, rol, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, "paciente", ?)';
        // Nota: Cambié "usuario" por "paciente" para mantener consistencia
        return await db.execute(sql, [nombre, apellidoP, apellidoM, correo, password, fechaNacimiento]);
    },
    
    // Función para buscar a alguien por su correo (MEJORADA para incluir fecha_nacimiento)
    buscarPorCorreo: async (correo) => {
        const [rows] = await db.execute('SELECT id_usuario, nombre, apellidoP, apellidoM, correo, password, rol, cedula, fecha_nacimiento FROM USUARIO WHERE correo = ?', [correo]);
        return rows[0]; // Devuelve los datos de esa persona incluyendo fecha_nacimiento
    },

    // NUEVA FUNCIÓN: Buscar usuario por ID (útil para obtener datos del perfil)
    buscarPorId: async (idUsuario) => {
        const [rows] = await db.execute('SELECT id_usuario, nombre, apellidoP, apellidoM, correo, rol, cedula, fecha_nacimiento, experiencia, url_pdf_perfil FROM USUARIO WHERE id_usuario = ?', [idUsuario]);
        return rows[0];
    },

    // NUEVA FUNCIÓN: Actualizar fecha de nacimiento (si es necesario)
    actualizarFechaNacimiento: async (idUsuario, fechaNacimiento) => {
        const sql = 'UPDATE USUARIO SET fecha_nacimiento = ? WHERE id_usuario = ?';
        return await db.execute(sql, [fechaNacimiento, idUsuario]);
    },

    // NUEVA FUNCIÓN: Obtener solo la edad calculada (útil para mostrar en listas)
    obtenerEdad: async (idUsuario) => {
        const [rows] = await db.execute('SELECT fecha_nacimiento FROM USUARIO WHERE id_usuario = ?', [idUsuario]);
        if (rows[0] && rows[0].fecha_nacimiento) {
            const fechaNac = new Date(rows[0].fecha_nacimiento);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const mes = hoy.getMonth() - fechaNac.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            return edad;
        }
        return null;
    },

    // NUEVA FUNCIÓN: Obtener todos los pacientes (con edad calculada)
    obtenerTodosPacientes: async () => {
        const [rows] = await db.execute('SELECT id_usuario, nombre, apellidoP, apellidoM, correo, rol, fecha_nacimiento FROM USUARIO WHERE rol = "paciente" OR rol = "usuario" ORDER BY apellidoP, apellidoM');
        
        // Calcular edad para cada paciente
        const pacientesConEdad = rows.map(paciente => {
            let edad = null;
            if (paciente.fecha_nacimiento) {
                const fechaNac = new Date(paciente.fecha_nacimiento);
                const hoy = new Date();
                edad = hoy.getFullYear() - fechaNac.getFullYear();
                const mes = hoy.getMonth() - fechaNac.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                    edad--;
                }
            }
            return {
                ...paciente,
                edad: edad
            };
        });
        
        return pacientesConEdad;
    }
};

module.exports = Usuario;