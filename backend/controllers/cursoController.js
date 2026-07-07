// backend/controllers/cursoController.js

const Curso = require('../models/Curso');

const cursoController = {
    // Obtener todos los cursos
    getAll: async (req, res) => {
        try {
            const cursos = await Curso.findAll();
            res.json({
                success: true,
                data: cursos,
                total: cursos.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Obtener un curso por ID
    getById: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const curso = await Curso.findById(id);

            if (curso) {
                res.json({
                    success: true,
                    data: curso
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Curso no encontrado'
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Crear un nuevo curso
    create: async (req, res) => {
        try {
            const nuevoCurso = await Curso.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Curso creado exitosamente',
                data: nuevoCurso
            });
        } catch (error) {
            const status = error.message.includes('RN-03') ? 400 : 400;
            res.status(status).json({ success: false, error: error.message });
        }
    },

    // Actualizar un curso
    update: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const actualizado = await Curso.update(id, req.body);

            if (actualizado) {
                const cursoActualizado = await Curso.findById(id);
                res.json({
                    success: true,
                    message: 'Curso actualizado exitosamente',
                    data: cursoActualizado
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'El registro no existe o no sufrió modificaciones reales en la base de datos'
                });
            }
        } catch (error) {
            const status = error.message.includes('RN-03') ? 400 : 400;
            res.status(status).json({ success: false, error: error.message });
        }
    },

    // Eliminar un curso
    delete: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const eliminado = await Curso.delete(id);

            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Curso eliminado exitosamente'
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
    }
};

module.exports = cursoController;
