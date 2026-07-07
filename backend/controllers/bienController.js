// backend/controllers/bienController.js

const Bien = require('../models/Bien');

const bienController = {
    // RF-01: Obtener todos los bienes
    getAll: async (req, res) => {
        try {
            const bienes = await Bien.findAll();
            res.json({
                success: true,
                data: bienes,
                total: bienes.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    
    // RF-02: Crear nuevo bien
    create: async (req, res) => {
        try {
            const nuevoBien = await Bien.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Bien registrado exitosamente',
                data: nuevoBien
            });
        } catch (error) {
            const status = error.message.includes('RN-01') ? 409 : 400;
            res.status(status).json({ success: false, error: error.message });
        }
    },
    
    // OBTENER BIEN POR ID - ¡AGREGAR ESTO!
    getById: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const bien = await Bien.findById(id);
            
            if (bien) {
                res.json({
                    success: true,
                    data: bien
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Bien no encontrado'
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    
    // RF-04: Actualizar bien
    update: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const actualizado = await Bien.update(id, req.body);
            
            if (actualizado) {
                const bienActualizado = await Bien.findById(id);
                res.json({
                    success: true,
                    message: 'Bien actualizado exitosamente',
                    data: bienActualizado
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'El registro no existe o no sufrió modificaciones reales en la base de datos'
                });
            }
        } catch (error) {
            const status = error.message.includes('RN-01') ? 409 : 400;
            res.status(status).json({ success: false, error: error.message });
        }
    },
    
    // RF-05: Hard delete
    delete: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const eliminado = await Bien.delete(id);
            
            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Bien dado de baja exitosamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'El registro no existe o no sufrió modificaciones reales en la base de datos'
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    
    // Obtener estadísticas
    getEstadisticas: async (req, res) => {
        try {
            const stats = await Bien.getEstadisticas();
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = bienController;