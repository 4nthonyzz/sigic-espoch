const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, esAdmin } = require('../middleware/auth');

// Todas las rutas en /api/admin requieren autenticación y rol de administrador
router.use(verificarToken, esAdmin);

// Métricas y catálogo
router.get('/metricas', adminController.getMetricas);
router.get('/cursos-catalogo', adminController.getCursosCatalogo);

// CRUD de Paralelos / Ofertas
router.get('/ofertas', adminController.getOfertas);
router.get('/ofertas/:id', adminController.getOfertaById);
router.post('/ofertas', adminController.createOferta);
router.put('/ofertas/:id', adminController.updateOferta);
router.delete('/ofertas/:id', adminController.deleteOferta);

module.exports = router;
