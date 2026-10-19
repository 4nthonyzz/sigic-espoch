const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const bienesRoutes = require('./routes/bienes');
const cursosRoutes = require('./routes/cursos');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const ofertasRoutes = require('./routes/ofertas');
const prematriculaRoutes = require('./routes/prematricula');

// Rutas de la API (según SRS Sección 2.1)
app.use('/api/bienes', bienesRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/prematricula', prematriculaRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', system: 'SIGIC-ESPOCH', version: '1.0' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`✅ SIGIC-ESPOCH Backend corriendo en http://localhost:${PORT}`);
    console.log(`📋 API endpoints: /api/bienes, /api/cursos`);
});