const db = require('../config/database');
const Pago = require('./Pago');

const Prematricula = {
    // Crear reserva con transacción atómica y bloqueo FOR UPDATE para concurrencia
    createReserva: async (usuario_id, oferta_id, { monto, comprobante }) => {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Bloqueo pesimista (FOR UPDATE) de la oferta para garantizar conteo exacto de cupos
            const [ofertas] = await connection.query(
                'SELECT * FROM ofertas_curso WHERE id = ? FOR UPDATE',
                [oferta_id]
            );

            if (ofertas.length === 0) {
                throw new Error('La oferta de curso seleccionada no existe.');
            }

            const oferta = ofertas[0];

            if (oferta.estado !== 'abierta') {
                throw new Error(`El paralelo se encuentra en estado '${oferta.estado}' y no admite nuevas reservas.`);
            }

            // Verificar fecha límite si existe
            if (oferta.fecha_limite) {
                const hoy = new Date();
                const limite = new Date(oferta.fecha_limite);
                if (hoy > limite) {
                    throw new Error('El plazo límite para pre-matricularse en este paralelo ha vencido.');
                }
            }

            // 2. Conteo de cupos actualmente ocupados (reservados o matriculados)
            const [conteo] = await connection.query(
                `SELECT COUNT(*) AS total 
                 FROM prematriculas 
                 WHERE oferta_id = ? AND estado IN ('reservada', 'matriculada')`,
                [oferta_id]
            );

            const totalOcupados = conteo[0].total;
            if (totalOcupados >= oferta.cupo_maximo) {
                throw new Error(`Cupo máximo alcanzado (${oferta.cupo_maximo} estudiantes). No hay vacantes disponibles.`);
            }

            // 3. Verificar si el estudiante ya tiene una pre-matrícula activa en este paralelo
            const [existente] = await connection.query(
                `SELECT id, estado FROM prematriculas 
                 WHERE usuario_id = ? AND oferta_id = ? AND estado IN ('reservada', 'matriculada')`,
                [usuario_id, oferta_id]
            );

            if (existente.length > 0) {
                throw new Error('Ya cuentas con una reserva o matrícula activa para este curso.');
            }

            // 4. Obtener datos del usuario para fijar la tarifa inmutablemente
            const [usuarios] = await connection.query(
                'SELECT id, nombres, correo, tarifa FROM usuarios WHERE id = ?',
                [usuario_id]
            );

            if (usuarios.length === 0) {
                throw new Error('Usuario no encontrado.');
            }

            const usuario = usuarios[0];
            const tarifaAplicada = usuario.tarifa; // 'institucional' o 'general'

            // Fijar costo total según tarifa institucional/general
            const costoTotal = tarifaAplicada === 'institucional'
                ? parseFloat(oferta.costo_reducido)
                : parseFloat(oferta.costo_general);

            // 5. Validar monto del pago mínimo de reserva
            const montoPago = parseFloat(monto);
            const pagoMinimoExigido = parseFloat(oferta.pago_minimo);

            if (isNaN(montoPago) || montoPago < pagoMinimoExigido) {
                throw new Error(`El pago mínimo no reembolsable para reservar el cupo es de $${pagoMinimoExigido.toFixed(2)}.`);
            }

            if (montoPago > costoTotal) {
                throw new Error(`El monto abonado no puede superar el costo total del curso ($${costoTotal.toFixed(2)}).`);
            }

            // 6. Insertar registro de pre-matrícula
            const [resPrematricula] = await connection.query(
                `INSERT INTO prematriculas (usuario_id, oferta_id, tarifa_aplicada, costo_total, estado)
                 VALUES (?, ?, ?, ?, 'reservada')`,
                [usuario_id, oferta_id, tarifaAplicada, costoTotal]
            );

            const prematriculaId = resPrematricula.insertId;

            // 7. Insertar registro del primer pago (reserva)
            const pagoReserva = await Pago.create({
                prematricula_id: prematriculaId,
                tipo: 'reserva',
                monto: montoPago,
                comprobante: comprobante || null,
                estado: 'pendiente',
                observacion: 'Pago de reserva inicial (no reembolsable)'
            }, connection);

            // Confirmar transacción
            await connection.commit();

            return {
                id: prematriculaId,
                usuario_id,
                oferta_id,
                tarifa_aplicada: tarifaAplicada,
                costo_total: costoTotal,
                estado: 'reservada',
                pago_reserva: pagoReserva
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Listar todas las pre-matrículas de un estudiante
    findByUsuario: async (usuario_id) => {
        const sql = `
            SELECT 
                p.id,
                p.usuario_id,
                p.oferta_id,
                c.nombre AS curso_nombre,
                c.periodo AS curso_periodo,
                c.instructor AS curso_instructor,
                oc.paralelo,
                oc.cupo_minimo,
                oc.cupo_maximo,
                oc.estado AS oferta_estado,
                p.tarifa_aplicada,
                p.costo_total,
                p.estado,
                p.created_at,
                COALESCE(SUM(CASE WHEN pag.estado = 'verificado' THEN pag.monto ELSE 0 END), 0) AS total_pagado,
                (p.costo_total - COALESCE(SUM(CASE WHEN pag.estado = 'verificado' THEN pag.monto ELSE 0 END), 0)) AS saldo_pendiente
            FROM prematriculas p
            INNER JOIN ofertas_curso oc ON p.oferta_id = oc.id
            INNER JOIN cursos c ON oc.curso_id = c.id
            LEFT JOIN pagos pag ON pag.prematricula_id = p.id
            WHERE p.usuario_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(sql, [usuario_id]);
        return rows.map(r => ({
            ...r,
            costo_total: parseFloat(r.costo_total),
            total_pagado: parseFloat(r.total_pagado),
            saldo_pendiente: Math.max(0, parseFloat(r.saldo_pendiente))
        }));
    },

    // Obtener detalle completo de una pre-matrícula por ID
    findById: async (id) => {
        const sql = `
            SELECT 
                p.id,
                p.usuario_id,
                u.nombres AS estudiante_nombre,
                u.correo AS estudiante_correo,
                u.cedula AS estudiante_cedula,
                p.oferta_id,
                c.id AS curso_id,
                c.nombre AS curso_nombre,
                c.periodo AS curso_periodo,
                c.instructor AS curso_instructor,
                oc.paralelo,
                oc.pago_minimo,
                oc.estado AS oferta_estado,
                p.tarifa_aplicada,
                p.costo_total,
                p.estado,
                p.created_at
            FROM prematriculas p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            INNER JOIN ofertas_curso oc ON p.oferta_id = oc.id
            INNER JOIN cursos c ON oc.curso_id = c.id
            WHERE p.id = ?
        `;
        const [rows] = await db.query(sql, [id]);
        if (rows.length === 0) return null;

        const prematricula = rows[0];
        const pagos = await Pago.findByPrematricula(id);

        const pagadoVerificado = pagos
            .filter(pg => pg.estado === 'verificado')
            .reduce((acc, curr) => acc + curr.monto, 0);

        return {
            ...prematricula,
            costo_total: parseFloat(prematricula.costo_total),
            total_pagado_verificado: pagadoVerificado,
            saldo_pendiente: Math.max(0, parseFloat(prematricula.costo_total) - pagadoVerificado),
            pagos
        };
    },

    // Anular una reserva por parte del estudiante (libera cupo, no reembolsa pago)
    anularReserva: async (id, usuario_id) => {
        const prematricula = await Prematricula.findById(id);
        if (!prematricula) {
            throw new Error('La pre-matrícula no existe.');
        }

        if (prematricula.usuario_id !== usuario_id) {
            throw new Error('No tienes permiso para anular esta reserva.');
        }

        if (prematricula.estado === 'matriculada') {
            throw new Error('No es posible anular una matrícula formalizada. Contacte a la coordinación.');
        }

        if (prematricula.estado === 'anulada') {
            throw new Error('La reserva ya se encuentra anulada.');
        }

        await db.query("UPDATE prematriculas SET estado = 'anulada' WHERE id = ?", [id]);
        return { success: true, message: 'Reserva anulada exitosamente. El cupo ha sido liberado.' };
    }
};

module.exports = Prematricula;
