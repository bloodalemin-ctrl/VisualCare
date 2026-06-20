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
    const query = "SELECT id_usuario, nombre, apellidoP, correo, rol FROM USUARIO WHERE rol = 'usuario' ORDER BY apellidoP";
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
// 🔥 CORREGIDO CON LEFT JOIN: ENDPOINTS DE NOTICIAS CON NOMBRE DE DOCTOR
// =========================================================================
app.get('/api/noticias', (req, res) => {
    const sql = `
        SELECT n.id_noticia, n.id_autor, n.titulo, n.contenido, n.tipo_multimedia, n.url_multimedia, n.fecha_publicacion,
               u.nombre AS autor_nombre, u.apellidoP AS autor_apellidoP
        FROM NOTICIA n
        LEFT JOIN USUARIO u ON n.id_autor = u.id_usuario
        ORDER BY n.fecha_publicacion DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const listado = results.map(row => ({
            id_noticia: row.id_noticia,
            id_autor: row.id_autor,
            doctor_nombre: row.autor_nombre ? `Dr. ${row.autor_nombre} ${row.autor_apellidoP || ''}` : 'Especialista',
            titulo: row.titulo,
            contenido: row.contenido,
            tipo_multimedia: row.tipo_multimedia,
            url_multimedia: row.url_multimedia ? `http://localhost:3000${row.url_multimedia}` : null,
            fecha_publicacion: row.fecha_publicacion
        }));
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

app.listen(PORT, () => console.log(`🚀 Backend listo en http://localhost:${PORT}`));