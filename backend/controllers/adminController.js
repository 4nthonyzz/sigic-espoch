const Oferta = require('../models/Oferta');
const db = require('../config/database');

const adminController = {
    // Listar todas las ofertas / paralelos
    getOfertas: async (req, res) => {
        try {
            const ofertas = await Oferta.findAll(req.query);
            res.json({
                success: true,
                total: ofertas.length,
                data: ofertas
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Obtener una oferta por ID
    getOfertaById: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const oferta = await Oferta.findById(id);

            if (!oferta) {
                return res.status(404).json({ success: false, error: 'Oferta de curso no encontrada' });
            }

            res.json({ success: true, data: oferta });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Crear nueva oferta / paralelo
    createOferta: async (req, res) => {
        try {
            const nuevaOferta = await Oferta.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Paralelo creado exitosamente',
                data: nuevaOferta
            });
        } catch (error) {
            const status = error.message.includes('RN-08') || error.message.includes('obligatorios') ? 400 : 409;
            res.status(status).json({ success: false, error: error.message });
        }
    },

    // Actualizar oferta / paralelo existente
    updateOferta: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const ofertaActualizada = await Oferta.update(id, req.body);
            res.json({
                success: true,
                message: 'Paralelo actualizado exitosamente',
                data: ofertaActualizada
            });
        } catch (error) {
            const status = error.message.includes('RN-08') ? 400 : 409;
            res.status(status).json({ success: false, error: error.message });
        }
    },

    // Eliminar o cancelar oferta
    deleteOferta: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const resultado = await Oferta.delete(id);
            res.json({
                success: true,
                message: resultado.cancelada ? resultado.message : 'Paralelo eliminado exitosamente'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Obtener catálogo base de cursos Cisco para el selector
    getCursosCatalogo: async (req, res) => {
        try {
            const [cursos] = await db.query(
                "SELECT id, nombre, instructor, periodo, estado FROM cursos WHERE estado != 'cancelado' ORDER BY nombre ASC"
            );
            res.json({ success: true, data: cursos });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Métricas del módulo para el dashboard administrativo
    getMetricas: async (req, res) => {
        try {
            const [totalOfertas] = await db.query("SELECT COUNT(*) AS total FROM ofertas_curso WHERE estado = 'abierta'");
            const [totalPrematriculas] = await db.query("SELECT COUNT(*) AS total FROM prematriculas");
            const [totalConfirmadas] = await db.query("SELECT COUNT(*) AS total FROM prematriculas WHERE estado = 'matriculada'");
            const [recaudado] = await db.query("SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE estado = 'verificado'");

            res.json({
                success: true,
                data: {
                    paralelos_abiertos: totalOfertas[0].total,
                    total_reservas: totalPrematriculas[0].total,
                    matriculados_confirmados: totalConfirmadas[0].total,
                    total_recaudado: parseFloat(recaudado[0].total)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = adminController;
