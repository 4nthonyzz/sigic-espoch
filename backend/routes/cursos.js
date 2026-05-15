const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todos los cursos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cursos ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear nuevo curso
router.post('/', async (req, res) => {
    try {
        const { nombre, participantes, instructor, horario } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ success: false, error: 'El nombre del curso es obligatorio' });
        }
        
        if (participantes < 0) {
            return res.status(400).json({ success: false, error: 'RN-03: Los participantes no pueden ser negativos' });
        }
        
        const [result] = await db.query(
            'INSERT INTO cursos (nombre, participantes, instructor, horario, estado) VALUES (?, ?, ?, ?, "activo")',
            [nombre, participantes || 0, instructor || null, horario || null]
        );
        
        res.json({ success: true, message: 'Curso creado exitosamente', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar curso
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, participantes, instructor, horario } = req.body;
        
        const [result] = await db.query(
            'UPDATE cursos SET nombre = COALESCE(?, nombre), participantes = COALESCE(?, participantes), instructor = COALESCE(?, instructor), horario = COALESCE(?, horario) WHERE id = ?',
            [nombre, participantes, instructor, horario, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Curso no encontrado' });
        }
        
        res.json({ success: true, message: 'Curso actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancelar curso (RN-07 - irreversible)
router.put('/:id/cancelar', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query(
            'UPDATE cursos SET estado = "cancelado" WHERE id = ? AND estado != "cancelado"',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Curso no encontrado o ya cancelado' });
        }
        
        res.json({ success: true, message: 'Curso cancelado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;