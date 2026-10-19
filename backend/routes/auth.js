const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// Rutas de autenticación
router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);

module.exports = router;
