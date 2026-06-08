const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cors());
// para usar rutas separadas
app.use('/api', authRoutes);

app.listen(3000, () => console.log(`Servidor corriendo en http://localhost:3000`));