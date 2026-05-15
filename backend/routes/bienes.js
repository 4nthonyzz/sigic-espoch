const express = require('express');
const router = express.Router();
const bienController = require('../controllers/bienController');

// Rutas según especificación
router.get('/', bienController.getAll);           // RF-01: Ver inventario
router.post('/', bienController.create);          // RF-02: Agregar bien
router.put('/:id', bienController.update);        // RF-04: Editar bien
router.delete('/:id', bienController.delete);     // RF-05: Eliminar bien (soft)
router.get('/estadisticas', bienController.getEstadisticas); // Reportes

module.exports = router;