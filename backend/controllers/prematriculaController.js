const Prematricula = require('../models/Prematricula');

const prematriculaController = {
    // Reservar un cupo en un paralelo (estudiante autenticado)
    reservar: async (req, res) => {
        try {
            const usuario_id = req.usuario.id;
            const { oferta_id, monto, comprobante } = req.body;

            if (!oferta_id || monto === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Debe especificar el paralelo (oferta_id) y el monto del pago de reserva.'
                });
            }

            const resultado = await Prematricula.createReserva(usuario_id, parseInt(oferta_id, 10), {
                monto: parseFloat(monto),
                comprobante: comprobante ? comprobante.trim() : null
            });

            res.status(201).json({
                success: true,
                message: 'Cupo reservado exitosamente. Pago de reserva registrado en estado pendiente de verificación.',
                data: resultado
            });
        } catch (error) {
            const status = error.message.includes('Cupo máximo') || error.message.includes('Ya cuentas con una reserva') ? 409 : 400;
            res.status(status).json({ success: false, error: error.message });
        }
    },

    // Listar las reservas y matrículas del estudiante autenticado
    getMisReservas: async (req, res) => {
        try {
            const usuario_id = req.usuario.id;
            const reservas = await Prematricula.findByUsuario(usuario_id);
            res.json({
                success: true,
                total: reservas.length,
                data: reservas
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Obtener el detalle completo de una reserva por ID
    getDetalleReserva: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const detalle = await Prematricula.findById(id);

            if (!detalle) {
                return res.status(404).json({ success: false, error: 'Pre-matrícula no encontrada.' });
            }

            // Validar que el estudiante solo pueda ver sus propias pre-matrículas (salvo que sea admin)
            if (req.usuario.rol !== 'admin' && detalle.usuario_id !== req.usuario.id) {
                return res.status(403).json({ success: false, error: 'Acceso denegado a esta reserva.' });
            }

            res.json({ success: true, data: detalle });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Anular reserva por parte del estudiante
    anularReserva: async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const usuario_id = req.usuario.id;

            const resultado = await Prematricula.anularReserva(id, usuario_id);
            res.json(resultado);
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};

module.exports = prematriculaController;
