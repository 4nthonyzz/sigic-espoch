const express = require('express');
const router = express.Router();
const Oferta = require('../models/Oferta');

// Ruta pública para que cualquier estudiante pueda ver los paralelos abiertos
router.get('/', async (req, res) => {
    try {
        const ofertas = await Oferta.findAll({ estado: 'abierta' });
        res.json({
            success: true,
            total: ofertas.length,
            data: ofertas
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ruta pública para ver el detalle de un paralelo específico
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const oferta = await Oferta.findById(id);

        if (!oferta) {
            return res.status(404).json({ success: false, error: 'Paralelo no encontrado' });
        }

        res.json({ success: true, data: oferta });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
