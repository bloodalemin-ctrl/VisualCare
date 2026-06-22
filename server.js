const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Declaramos uploadDir
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Carpeta uploads creada exitosamente');
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const nombreLimpio = file.originalname.replace(/\s+/g, '-');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + nombreLimpio);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|mov|avi|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes, PDFs y videos'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Conexión a MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,            
    user: 'root',
    password: '',          
    database: 'visioncare',
    connectTimeout: 10000,
    multipleStatements: true
});

// Función para calcular edad
const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
};

// ==========================================
// ENDPOINTS DE AUTENTICACIÓN (REGISTRO Y LOGIN)
// ==========================================

// Registro de usuario
app.post('/api/registro', (req, res) => {
    console.log("=".repeat(50));
    console.log("📥 Datos recibidos en registro:", req.body);
    console.log("=".repeat(50));
    
    const { nombre, apellidoP, apellidoM, correo, password, fechaNacimiento } = req.body;
    
    // Validación de campos obligatorios
    if (!nombre || !apellidoP || !apellidoM || !correo || !password || !fechaNacimiento) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios (incluyendo fecha de nacimiento)' });
    }

    // Validación del formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fechaNacimiento)) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    // Validación: que no sea una fecha futura
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaNac.setHours(0, 0, 0, 0);
    
    if (fechaNac > hoy) {
        return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
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

    const sql = 'INSERT INTO USUARIO (nombre, apellidoP, apellidoM, correo, password, rol, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, "usuario", ?)';
    
    db.query(sql, [nombre, apellidoP, apellidoM, correo, password, fechaNacimiento], (err, result) => {
        if (err) {
            console.error("❌ Error en registro:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El correo ya está registrado.' });
            }
            return res.status(500).json({ error: 'Error del servidor al registrar.' });
        }
        
        console.log("✅ Usuario registrado exitosamente:", correo);
        res.status(201).json({ message: 'Registro exitoso. Por favor inicia sesión.' });
    });
});

// Login de usuario
app.post('/api/login', (req, res) => {
    console.log("📝 Datos que llegaron desde React:", req.body);
    
    const { correo, password } = req.body;
    
    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const sql = 'SELECT id_usuario, nombre, apellidoP, apellidoM, correo, password, rol, cedula, fecha_nacimiento FROM USUARIO WHERE correo = ?';
    
    db.query(sql, [correo], (err, results) => {
        if (err) {
            console.error("❌ Error en login:", err);
            return res.status(500).json({ error: 'Error del servidor.' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }
        
        const usuario = results[0];
        
        if (password !== usuario.password) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }
        
        // Calcular edad
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
        
        console.log("✅ Login exitoso para usuario:", correo);
        
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
                edad: edad
            }
        });
    });
});

// ==========================================
// ENDPOINTS PARA PACIENTES
// ==========================================
app.get('/api/medico/:idMedico/pacientes', (req, res) => {
    const { idMedico } = req.params;
    const query = "SELECT id_usuario as id, nombre, apellidoP, apellidoM, correo, rol, fecha_nacimiento FROM USUARIO WHERE rol IN ('usuario', 'paciente') ORDER BY apellidoP, apellidoM";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error buscando pacientes:", err);
            return res.status(500).json({ error: err.message });
        }
        
        const pacientesConEdad = results.map(paciente => ({
            id: paciente.id,
            nombre: paciente.nombre,
            apellidoP: paciente.apellidoP,
            apellidoM: paciente.apellidoM,
            correo: paciente.correo,
            rol: paciente.rol,
            edad: calcularEdad(paciente.fecha_nacimiento)
        }));
        
        console.log(`👥 Se enviaron ${pacientesConEdad.length} pacientes a React`);
        res.json(pacientesConEdad);
    });
});

// ==========================================
// ENDPOINTS PARA HISTORIAL
// ==========================================
app.get('/api/historial/:idPaciente', (req, res) => {
    const { idPaciente } = req.params;
    const query = `SELECT * FROM historial_paciente WHERE id_usuario = ? ORDER BY fecha DESC`;
    
    db.query(query, [idPaciente], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const historialAdaptado = results.map(row => ({
            id: row.id_historial,
            tipo: 'Reporte Médico',
            resultado: row.resultado,
            url_archivo: row.url_archivo ? `http://localhost:3000${row.url_archivo}` : null,
            tipo_archivo: row.tipo_archivo,
            fecha: `Publicado el: ${new Date(row.fecha).toLocaleString('es-ES')}`
        }));
        
        res.json(historialAdaptado);
    });
});

app.post('/api/historial/:idPaciente', upload.single('archivo'), (req, res) => {
    const { idPaciente } = req.params;
    const { resultado } = req.body;
    const archivo = req.file;

    let url_archivo = null;
    let tipo_archivo = null;

    if (archivo) {
        url_archivo = `/uploads/${archivo.filename}`;
        const ext = path.extname(archivo.originalname).toLowerCase();
        tipo_archivo = ext === '.pdf' ? 'pdf' : 'imagen';
    }

    const query = 'INSERT INTO historial_paciente (id_usuario, resultado, url_archivo, tipo_archivo) VALUES (?, ?, ?, ?)';
    db.query(query, [idPaciente, resultado || null, url_archivo, tipo_archivo], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
            id: result.insertId,
            tipo: 'Reporte Médico',
            resultado,
            url_archivo: url_archivo ? `http://localhost:3000${url_archivo}` : null,
            tipo_archivo,
            fecha: `Publicado el: ${new Date().toLocaleString('es-ES')}`
        });
    });
});

app.put('/api/historial/:idRegistro', (req, res) => {
    const { idRegistro } = req.params;
    const { resultado } = req.body;

    const query = 'UPDATE historial_paciente SET resultado = ? WHERE id_historial = ?';
    db.query(query, [resultado, idRegistro], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Historial actualizado' });
    });
});

app.delete('/api/historial/:idRegistro', (req, res) => {
    const { idRegistro } = req.params;
    
    db.query('SELECT url_archivo FROM historial_paciente WHERE id_historial = ?', [idRegistro], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0 && results[0].url_archivo) {
            const fileName = path.basename(results[0].url_archivo);
            const filePath = path.join(__dirname, 'uploads', fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        db.query('DELETE FROM historial_paciente WHERE id_historial = ?', [idRegistro], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: 'Registro clínico eliminado' });
        });
    });
});

// ==========================================
// ENDPOINTS PARA NOTICIAS (MURO)
// ==========================================
app.get('/api/noticias', (req, res) => {
    const formatearNoticias = (filas) => {
        return filas.map(pub => ({
            ...pub,
            url_archivo: (pub.url_archivo && !pub.url_archivo.includes('http')) 
                ? `http://localhost:3000${pub.url_archivo}` 
                : pub.url_archivo,
            fecha: new Date(pub.fecha).toLocaleString('es-ES')
        }));
    };

    db.query('SELECT * FROM NOTICIA ORDER BY fecha DESC', (err, results) => {
        if (err) {
            db.query('SELECT * FROM NOTICIAS ORDER BY fecha DESC', (err2, results2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json(formatearNoticias(results2));
            });
        } else {
            res.json(formatearNoticias(results));
        }
    });
});

app.post('/api/noticias', upload.single('archivo'), (req, res) => {
    const { titulo, texto } = req.body;
    const archivo = req.file;
    
    let url_archivo = null;
    let tipo_archivo = null;
    
    if (archivo) {
        url_archivo = `/uploads/${archivo.filename}`;
        const ext = path.extname(archivo.originalname).toLowerCase();
        if (ext === '.pdf') tipo_archivo = 'pdf';
        else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) tipo_archivo = 'video';
        else tipo_archivo = 'imagen';
    }
    
    db.query('INSERT INTO NOTICIA (titulo, texto, url_archivo, tipo_archivo, fecha) VALUES (?, ?, ?, ?, NOW())', 
    [titulo || null, texto || null, url_archivo, tipo_archivo], (err, result) => {
        if (err) {
            db.query('INSERT INTO NOTICIAS (titulo, texto, url_archivo, tipo_archivo, fecha) VALUES (?, ?, ?, ?, NOW())', 
            [titulo || null, texto || null, url_archivo, tipo_archivo], (err2, result2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ 
                    id: result2.insertId, 
                    titulo, 
                    texto, 
                    url_archivo: url_archivo ? `http://localhost:3000${url_archivo}` : null, 
                    tipo_archivo, 
                    fecha: `Publicado el: ${new Date().toLocaleString('es-ES')}`
                });
            });
        } else {
            res.json({ 
                id: result.insertId, 
                titulo, 
                texto, 
                url_archivo: url_archivo ? `http://localhost:3000${url_archivo}` : null, 
                tipo_archivo, 
                fecha: `Publicado el: ${new Date().toLocaleString('es-ES')}`
            });
        }
    });
});

app.delete('/api/noticias/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM NOTICIA WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
            db.query('SELECT * FROM NOTICIAS WHERE id_noticia = ?', [id], (err2, results2) => {
                if (err2 || results2.length === 0) {
                    return res.status(404).json({ message: 'Publicación no encontrada' });
                }
                ejecutarBorrado(results2[0], id, 'NOTICIAS', 'id_noticia');
            });
        } else {
            ejecutarBorrado(results[0], id, 'NOTICIA', 'id');
        }
    });

    function ejecutarBorrado(publicacion, id, tabla, idColumna) {
        if (publicacion.url_archivo) {
            const fileName = path.basename(publicacion.url_archivo);
            const filePath = path.join(__dirname, 'uploads', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Archivo eliminado: ${fileName}`);
            }
        }
        
        db.query(`DELETE FROM ${tabla} WHERE ${idColumna} = ?`, [id], (errDelete) => {
            if (errDelete) return res.status(500).json({ error: errDelete.message });
            res.json({ message: 'Publicación eliminada exitosamente' });
        });
    }
});

// ==========================================
// ENDPOINTS PARA PERFIL MÉDICO
// ==========================================

// Obtener publicaciones del perfil médico
app.get('/api/perfil-medico/:idMedico/publicaciones', (req, res) => {
    const { idMedico } = req.params;
    
    const query = `
        SELECT id_publicacion as id, texto, url_pdf, fecha, created_at
        FROM perfil_medico_publicaciones 
        WHERE id_medico = ? 
        ORDER BY created_at DESC, fecha DESC
    `;
    
    db.query(query, [idMedico], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const publicacionesConUrl = results.map(pub => ({
            id: pub.id,
            texto: pub.texto,
            url_pdf: pub.url_pdf ? `http://localhost:3000${pub.url_pdf}` : null,
            fecha: `Publicado el: ${new Date(pub.created_at || pub.fecha).toLocaleString('es-ES')}`
        }));
        
        res.json(publicacionesConUrl);
    });
});

// Crear publicación en perfil médico
app.post('/api/perfil-medico/:idMedico/publicaciones', upload.single('pdf'), (req, res) => {
    const { idMedico } = req.params;
    const { texto } = req.body;
    const pdfFile = req.file;
    
    let url_pdf = null;
    if (pdfFile) {
        url_pdf = `/uploads/${pdfFile.filename}`;
    }
    
    const query = `INSERT INTO perfil_medico_publicaciones (id_medico, texto, url_pdf, fecha, created_at) VALUES (?, ?, ?, CURDATE(), NOW())`;
    
    db.query(query, [idMedico, texto || null, url_pdf], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
            id: result.insertId,
            texto: texto || null,
            url_pdf: url_pdf ? `http://localhost:3000${url_pdf}` : null,
            fecha: `Publicado el: ${new Date().toLocaleString('es-ES')}`
        });
    });
});

// Eliminar publicación del perfil médico
app.delete('/api/perfil-medico/publicaciones/:idPublicacion', (req, res) => {
    const { idPublicacion } = req.params;
    
    db.query('SELECT url_pdf FROM perfil_medico_publicaciones WHERE id_publicacion = ?', [idPublicacion], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }
        
        if (results[0].url_pdf) {
            const fileName = path.basename(results[0].url_pdf);
            const filePath = path.join(__dirname, 'uploads', fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        db.query('DELETE FROM perfil_medico_publicaciones WHERE id_publicacion = ?', [idPublicacion], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: 'Publicación eliminada exitosamente' });
        });
    });
});

// Obtener datos del perfil médico
app.get('/api/perfil-medico/:idMedico', (req, res) => {
    const { idMedico } = req.params;
    const query = 'SELECT experiencia, url_pdf_perfil FROM USUARIO WHERE id_usuario = ?';
    
    db.query(query, [idMedico], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.json({ experiencia: '', url_pdf_perfil: null });
        }
        
        const data = results[0];
        if (data.url_pdf_perfil && !data.url_pdf_perfil.includes('http')) {
            data.url_pdf_perfil = `http://localhost:3000${data.url_pdf_perfil}`;
        }
        res.json(data);
    });
});

// Actualizar perfil médico
app.post('/api/perfil-medico/:idMedico', upload.single('pdfPerfil'), (req, res) => {
    const { idMedico } = req.params;
    const { experiencia } = req.body;
    const pdfFile = req.file;
    
    let url_pdf_perfil = null;
    if (pdfFile) {
        url_pdf_perfil = `/uploads/${pdfFile.filename}`;
    }
    
    const checkQuery = 'SELECT id_usuario FROM USUARIO WHERE id_usuario = ?';
    db.query(checkQuery, [idMedico], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        let query, params;
        if (url_pdf_perfil) {
            query = 'UPDATE USUARIO SET experiencia = ?, url_pdf_perfil = ? WHERE id_usuario = ?';
            params = [experiencia, url_pdf_perfil, idMedico];
        } else {
            query = 'UPDATE USUARIO SET experiencia = ? WHERE id_usuario = ?';
            params = [experiencia, idMedico];
        }
        
        db.query(query, params, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Perfil actualizado',
                url_pdf_perfil: url_pdf_perfil ? `http://localhost:3000${url_pdf_perfil}` : null
            });
        });
    });
});

// Eliminar PDF del perfil
app.delete('/api/perfil-medico/:idMedico/pdf', (req, res) => {
    const { idMedico } = req.params;
    db.query('SELECT url_pdf_perfil FROM USUARIO WHERE id_usuario = ?', [idMedico], (err, results) => {
        if (err) return res.status(500).json({ error: err.message }); 
        if (results.length > 0 && results[0].url_pdf_perfil) {
            const fileName = path.basename(results[0].url_pdf_perfil);
            const filePath = path.join(__dirname, 'uploads', fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            
            db.query('UPDATE USUARIO SET url_pdf_perfil = NULL WHERE id_usuario = ?', [idMedico], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ message: 'Documento eliminado correctamente' });
            });
        } else {
            res.status(404).json({ message: 'No se encontró un documento para eliminar' });
        }
    });
});

// Eliminar experiencia
app.delete('/api/perfil-medico/:idMedico/experiencia', (req, res) => {
    const { idMedico } = req.params;
    db.query('UPDATE USUARIO SET experiencia = NULL WHERE id_usuario = ?', [idMedico], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Trayectoria borrada correctamente' });
    });
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==========================================
// ENDPOINTS PARA ADMIN - GESTIÓN DE MÉDICOS
// ==========================================

// 1. OBTENER todos los médicos (READ)
app.get('/api/admin/medicos', (req, res) => {
    // Buscamos solo a los usuarios que tengan el rol de optometrista
    const sql = 'SELECT id_usuario as id, nombre, apellidoP, apellidoM, correo, cedula, fecha_nacimiento FROM USUARIO WHERE rol = "optometrista"';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error obteniendo médicos:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. CREAR un nuevo médico (CREATE)
app.post('/api/admin/medicos', (req, res) => {
    const { nombre, apellidoP, apellidoM, correo, password, cedula, fechaNacimiento } = req.body;
    
    // Lo insertamos forzando que el rol sea "optometrista"
    const sql = 'INSERT INTO USUARIO (nombre, apellidoP, apellidoM, correo, password, rol, cedula, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, "optometrista", ?, ?)';
    
    db.query(sql, [nombre, apellidoP, apellidoM, correo, password, cedula, fechaNacimiento], (err, result) => {
        if (err) {
            console.error("❌ Error creando médico:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Médico creado exitosamente', id: result.insertId });
    });
});

// 3. ELIMINAR un médico (DELETE)
app.delete('/api/admin/medicos/:id', (req, res) => {
    const { id } = req.params;
    
    // Por seguridad, confirmamos que sea un optometrista antes de borrar
    const sql = 'DELETE FROM USUARIO WHERE id_usuario = ? AND rol = "optometrista"';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Error eliminando médico:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Médico eliminado correctamente' });
    });
});

// 4. ACTUALIZAR un médico (UPDATE)
app.put('/api/admin/medicos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellidoP, apellidoM, correo, cedula, fechaNacimiento } = req.body;
    
    // Actualizamos los datos (dejamos la contraseña intacta por seguridad)
    const sql = 'UPDATE USUARIO SET nombre = ?, apellidoP = ?, apellidoM = ?, correo = ?, cedula = ?, fecha_nacimiento = ? WHERE id_usuario = ? AND rol = "optometrista"';
    
    db.query(sql, [nombre, apellidoP, apellidoM, correo, cedula, fechaNacimiento, id], (err, result) => {
        if (err) {
            console.error("❌ Error actualizando médico:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Médico actualizado correctamente' });
    });
});

// 5. OBTENER todos los pacientes (READ para Admin)
app.get('/api/admin/pacientes', (req, res) => {
    const sql = 'SELECT id_usuario as id, nombre, apellidoP, apellidoM, correo, fecha_nacimiento FROM USUARIO WHERE rol = "usuario" OR rol = "paciente"';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error obteniendo pacientes:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ==========================================
// MANEJO DE ERRORES
// ==========================================
app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 50MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// ==========================================
// CONEXIÓN A BD E INICIO
// ==========================================
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        process.exit(1);
    }
    console.log('✅ Conectado exitosamente a MySQL en el puerto 3307');
    
    // Verificar columna fecha_nacimiento
    db.query(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'visioncare' AND TABLE_NAME = 'USUARIO' AND COLUMN_NAME = 'fecha_nacimiento'
    `, (err, results) => {
        if (!err && results[0].count === 0) {
            db.query('ALTER TABLE USUARIO ADD COLUMN fecha_nacimiento DATE AFTER apellidoM', (err) => {
                if (err) console.error('❌ Error:', err);
                else console.log('✅ Columna fecha_nacimiento agregada');
            });
        } else if (!err) {
            console.log('✅ Columna fecha_nacimiento ya existe');
        }
    });
    
    // Crear tabla de publicaciones
    db.query(`
        CREATE TABLE IF NOT EXISTS perfil_medico_publicaciones (
            id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
            id_medico INT NOT NULL,
            texto TEXT,
            url_pdf VARCHAR(500),
            fecha DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_medico) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('❌ Error creando tabla:', err);
        else console.log('✅ Tabla perfil_medico_publicaciones OK');
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Endpoints disponibles:`);
    console.log(`   POST /api/registro`);
    console.log(`   POST /api/login`);
    console.log(`   GET  /api/medico/:idMedico/pacientes`);
    console.log(`   GET  /api/historial/:idPaciente`);
    console.log(`   GET  /api/noticias`);
    console.log(`   GET  /api/perfil-medico/:idMedico/publicaciones`);
    console.log(`\n✨ Sistema listo!`);
});