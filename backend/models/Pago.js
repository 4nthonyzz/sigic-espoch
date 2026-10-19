const db = require('../config/database');

const Pago = {
    // Registrar un nuevo pago (asociado a una conexión de transacción o al pool)
    create: async ({ prematricula_id, tipo, monto, comprobante, estado = 'pendiente', observacion = null }, connection = null) => {
        const client = connection || db;
        const [result] = await client.query(
            `INSERT INTO pagos (prematricula_id, tipo, monto, comprobante, estado, observacion)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [prematricula_id, tipo, parseFloat(monto), comprobante ? comprobante.trim() : null, estado, observacion]
        );

        return {
            id: result.insertId,
            prematricula_id,
            tipo,
            monto: parseFloat(monto),
            comprobante,
            estado,
            observacion
        };
    },

    // Obtener todos los pagos de una pre-matrícula
    findByPrematricula: async (prematricula_id) => {
        const [rows] = await db.query(
            `SELECT id, prematricula_id, tipo, monto, comprobante, estado, observacion, created_at
             FROM pagos
             WHERE prematricula_id = ?
             ORDER BY created_at ASC`,
            [prematricula_id]
        );
        return rows.map(r => ({ ...r, monto: parseFloat(r.monto) }));
    },

    // Buscar pago por ID
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM pagos WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return { ...rows[0], monto: parseFloat(rows[0].monto) };
    },

    // Actualizar estado de verificación de un pago (aprobado o rechazado por administración)
    updateEstado: async (id, estado, observacion = null, connection = null) => {
        const client = connection || db;
        const validEstados = ['pendiente', 'verificado', 'rechazado'];
        if (!validEstados.includes(estado)) {
            throw new Error('Estado de pago no válido');
        }

        await client.query(
            'UPDATE pagos SET estado = ?, observacion = ? WHERE id = ?',
            [estado, observacion, id]
        );

        return await Pago.findById(id);
    }
};

module.exports = Pago;
