const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración y creación estática de la carpeta de subidas
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Carpeta uploads creada exitosamente');
}

// Configuración de almacenamiento para Multer
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

// Conexión a tu Base de Datos (WAMP - Puerto 3306)
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,            
    user: 'root',
    password: '',          
    database: 'visioncare',
    connectTimeout: 10000,
    multipleStatements: true
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL WAMP:', err);
        process.exit(1);
    }
    console.log('✅ Base de datos conectada exitosamente a MySQL WAMP (Puerto 3306)');
});

// Carga opcional de tus módulos MVC de Ale
try {
    app.use('/api', require('./routes/cvsqRoutes'));
    app.use('/api', require('./routes/distanciaRoutes'));
} catch (err) {}

// ==========================================
// ENDPOINTS DE LOGUEO Y AUTENTICACIÓN
// ==========================================
app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT id_usuario, nombre, apellidoP, correo, password, rol FROM USUARIO WHERE correo = ?';
    db.query(sql, [correo], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (results.length === 0 || password !== results[0].password) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        const user = results[0];
        res.json({
            message: 'Acceso concedido',
            usuario: { id: user.id_usuario, nombre: user.nombre, apellidoP: user.apellidoP, correo: user.correo, rol: user.rol }
        });
    });
});

// ==========================================
// ENDPOINTS DE PACIENTES (MEDICO)
// ==========================================
app.get('/api/medico/:idMedico/pacientes', (req, res) => {
    const query = "SELECT id_usuario, nombre, apellidoP, correo, rol FROM USUARIO WHERE rol IN ('usuario', 'paciente') ORDER BY apellidoP";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/historial/:idPaciente', (req, res) => {
    const query = 'SELECT id_test, tipo, resultado, fecha FROM TEST_VISUAL WHERE id_usuario = ? ORDER BY fecha DESC';
    db.query(query, [req.params.idPaciente], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const adaptados = results.map(r => ({
            id: r.id_test, tipo: r.tipo, resultado: r.resultado, fecha: new Date(r.fecha).toLocaleString('es-ES')
        }));
        res.json(adaptados);
    });
});

app.post('/api/historial/:idPaciente', (req, res) => {
    const query = 'INSERT INTO TEST_VISUAL (id_usuario, tipo, resultado, fecha) VALUES (?, ?, ?, NOW())';
    db.query(query, [req.params.idPaciente, req.body.tipo || 'Reporte Médico', req.body.resultado], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, tipo: req.body.tipo || 'Reporte Médico', resultado: req.body.resultado, fecha: new Date().toLocaleString('es-ES') });
    });
});

app.delete('/api/historial/:idRegistro', (req, res) => {
    db.query('DELETE FROM TEST_VISUAL WHERE id_test = ?', [req.params.idRegistro], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Registro eliminado' });
    });
});

// =========================================================================
// 🔥 ENDPOINTS DE NOTICIAS CON VALIDACIÓN DE ROL (DR. vs ADMIN)
// =========================================================================
app.get('/api/noticias', (req, res) => {
    const sql = `
        SELECT n.id_noticia, n.id_autor, n.titulo, n.contenido, n.tipo_multimedia, n.url_multimedia, n.fecha_publicacion,
               u.nombre AS autor_nombre, u.apellidoP AS autor_apellidoP, u.rol AS autor_rol
        FROM NOTICIA n
        LEFT JOIN USUARIO u ON n.id_autor = u.id_usuario
        ORDER BY n.fecha_publicacion DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const listado = results.map(row => {
            let prefijo = 'Especialista';
            if (row.autor_nombre) {
                prefijo = row.autor_rol === 'admin' ? 'Admin.' : 'Dr.';
            }

            return {
                id_noticia: row.id_noticia,
                id_autor: row.id_autor,
                doctor_nombre: row.autor_nombre ? `${prefijo} ${row.autor_nombre} ${row.autor_apellidoP || ''}` : 'Especialista',
                titulo: row.titulo,
                contenido: row.contenido,
                tipo_multimedia: row.tipo_multimedia,
                url_multimedia: row.url_multimedia ? `http://localhost:3000${row.url_multimedia}` : null,
                fecha_publicacion: row.fecha_publicacion
            };
        });
        res.json(listado);
    });
});

app.post('/api/noticias', upload.single('archivo'), (req, res) => {
    const { titulo, contenido, id_autor } = req.body;
    let url_multimedia = null;
    let tipo_multimedia = 'texto';

    const autorReal = id_autor && id_autor !== 'undefined' ? parseInt(id_autor) : 1;

    if (req.file) {
        url_multimedia = `/uploads/${req.file.filename}`;
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) tipo_multimedia = 'imagen';
        if (['.mp4', '.mov', '.avi'].includes(ext)) tipo_multimedia = 'video';
        if (ext === '.pdf') tipo_multimedia = 'pdf';
    }

    const sql = 'INSERT INTO NOTICIA (id_autor, titulo, contenido, tipo_multimedia, url_multimedia, fecha_publicacion) VALUES (?, ?, ?, ?, ?, NOW())';
    db.query(sql, [autorReal, titulo || 'Sin título', contenido || '', tipo_multimedia, url_multimedia], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            id_noticia: result.insertId,
            id_autor: autorReal,
            titulo: titulo || 'Sin título',
            contenido: contenido || '',
            tipo_multimedia,
            url_multimedia: url_multimedia ? `http://localhost:3000${url_multimedia}` : null,
            fecha_publicacion: new Date().toISOString()
        });
    });
});

app.put('/api/noticias/:id', upload.single('archivo'), (req, res) => {
    const { id } = req.params;
    const { titulo, contenido } = req.body;
    
    let sql = 'UPDATE NOTICIA SET titulo = ?, contenido = ?';
    let params = [titulo, contenido];

    if (req.file) {
        let tipo_multimedia = 'texto';
        const url_multimedia = `/uploads/${req.file.filename}`;
        const ext = path.extname(req.file.originalname).toLowerCase();
        
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) tipo_multimedia = 'imagen';
        if (['.mp4', '.mov', '.avi'].includes(ext)) tipo_multimedia = 'video';
        if (ext === '.pdf') tipo_multimedia = 'pdf';

        sql += ', url_multimedia = ?, tipo_multimedia = ?';
        params.push(url_multimedia, tipo_multimedia);
    }
    
    sql += ' WHERE id_noticia = ?';
    params.push(id);

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Noticia actualizada correctamente' });
    });
});

app.delete('/api/noticias/:id', (req, res) => {
    db.query('DELETE FROM NOTICIA WHERE id_noticia = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Noticia eliminada' });
    });
});

// Perfil Médico auxiliar
app.get('/api/perfil-medico/:idMedico/publicaciones', (req, res) => {
    db.query("SELECT id_test as id, resultado as texto, fecha FROM TEST_VISUAL WHERE id_usuario = ? AND tipo = 'Perfil' ORDER BY fecha DESC", [req.params.idMedico], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/perfil-medico/:idMedico/publicaciones', (req, res) => {
    db.query("INSERT INTO TEST_VISUAL (id_usuario, tipo, resultado, fecha) VALUES (?, 'Perfil', ?, NOW())", [req.params.idMedico, req.body.texto], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, texto: req.body.texto, fecha: new Date() });
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
// ENDPOINTS PARA ADMIN - GESTIÓN DE USUARIOS
// ==========================================

// 1. OBTENER TODOS los usuarios (READ) - MODIFICADO PARA INCLUIR EL ROL
app.get('/api/admin/medicos', (req, res) => {
    // Ya no filtramos por optometrista, traemos a todos con su rol
    const sql = 'SELECT id_usuario as id, nombre, apellidoP, apellidoM, correo, cedula, fecha_nacimiento, rol FROM USUARIO';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error obteniendo usuarios:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. CREAR un nuevo usuario con ROL (CREATE)
app.post('/api/admin/medicos', (req, res) => {
    const { nombre, apellidoP, apellidoM, correo, password, cedula, fechaNacimiento, rol } = req.body;
    const rolAsignado = rol || 'paciente';
    const sql = 'INSERT INTO USUARIO (nombre, apellidoP, apellidoM, correo, password, rol, cedula, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [nombre, apellidoP, apellidoM, correo, password, rolAsignado, cedula, fechaNacimiento], (err, result) => {
        if (err) {
            console.error("❌ Error creando usuario:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Usuario creado exitosamente', id: result.insertId });
    });
});

// 3. ELIMINAR un usuario (DELETE)
app.delete('/api/admin/medicos/:id', (req, res) => {
    const { id } = req.params;
    // Quitamos la restricción de que solo borre optometristas para que el Admin pueda borrar a cualquiera
    const sql = 'DELETE FROM USUARIO WHERE id_usuario = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Error eliminando usuario:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    });
});

// 4. ACTUALIZAR un usuario con ROL (UPDATE)
app.put('/api/admin/medicos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellidoP, apellidoM, correo, cedula, fechaNacimiento, rol } = req.body;
    
    const sql = 'UPDATE USUARIO SET nombre = ?, apellidoP = ?, apellidoM = ?, correo = ?, cedula = ?, fecha_nacimiento = ?, rol = ? WHERE id_usuario = ?';
    
    db.query(sql, [nombre, apellidoP, apellidoM, correo, cedula, fechaNacimiento, rol, id], (err, result) => {
        if (err) {
            console.error("❌ Error actualizando usuario:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Usuario actualizado correctamente' });
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

// 6. OBTENER Historial Completo de un Paciente (Test + Reportes)
app.get('/api/admin/pacientes/:id/historial', (req, res) => {
    const { id } = req.params;

    const sqlTests = 'SELECT * FROM test_visual WHERE id_usuario = ? ORDER BY id_test DESC';
    const sqlReportes = 'SELECT * FROM reporte WHERE id_usuario = ? ORDER BY id_reporte DESC';

    db.query(sqlTests, [id], (err, tests) => {
        if (err) {
            console.error("❌ Error obteniendo tests visuales:", err);
            return res.status(500).json({ error: err.message });
        }

        db.query(sqlReportes, [id], (err2, reportes) => {
            if (err2) {
                console.error("❌ Error obteniendo reportes:", err2);
                return res.status(500).json({ error: err2.message });
            }

            res.json({
                tests: tests,
                reportes: reportes
            });
        });
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