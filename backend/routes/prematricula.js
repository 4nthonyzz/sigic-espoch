const express = require('express');
const router = express.Router();
const prematriculaController = require('../controllers/prematriculaController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas de pre-matrícula requieren autenticación
router.use(verificarToken);

// Endpoints del estudiante
router.post('/reservar', prematriculaController.reservar);
router.get('/mis-reservas', prematriculaController.getMisReservas);
router.get('/:id', prematriculaController.getDetalleReserva);
router.put('/:id/anular', prematriculaController.anularReserva);

module.exports = router;
