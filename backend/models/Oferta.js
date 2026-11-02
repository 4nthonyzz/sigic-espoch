const db = require('../config/database');

const Oferta = {
    // Listar todas las ofertas de cursos con datos del catálogo y métricas de cupo
    findAll: async (filtros = {}) => {
        let sql = `
            SELECT 
                oc.id,
                oc.curso_id,
                c.nombre AS curso_nombre,
                c.periodo AS curso_periodo,
                c.instructor AS curso_instructor,
                oc.paralelo,
                oc.costo_general,
                oc.costo_reducido,
                oc.pago_minimo,
                oc.cupo_minimo,
                oc.cupo_maximo,
                oc.fecha_limite,
                oc.estado,
                oc.created_at,
                COUNT(CASE WHEN p.estado IN ('reservada', 'matriculada') THEN 1 END) AS total_ocupados,
                COUNT(CASE WHEN p.estado = 'reservada' THEN 1 END) AS total_reservados,
                COUNT(CASE WHEN p.estado = 'matriculada' THEN 1 END) AS total_matriculados,
                (oc.cupo_maximo - COUNT(CASE WHEN p.estado IN ('reservada', 'matriculada') THEN 1 END)) AS cupos_disponibles,
                IF(COUNT(CASE WHEN p.estado IN ('reservada', 'matriculada') THEN 1 END) >= oc.cupo_minimo, 1, 0) AS apto_iniciar
            FROM ofertas_curso oc
            INNER JOIN cursos c ON oc.curso_id = c.id
            LEFT JOIN prematriculas p ON p.oferta_id = oc.id
        `;

        const conditions = [];
        const params = [];

        if (filtros.estado) {
            conditions.push('oc.estado = ?');
            params.push(filtros.estado);
        }

        if (filtros.curso_id) {
            conditions.push('oc.curso_id = ?');
            params.push(filtros.curso_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY oc.id ORDER BY c.nombre ASC, oc.paralelo ASC';

        const [rows] = await db.query(sql, params);
        return rows.map(r => ({
            ...r,
            apto_iniciar: Boolean(r.apto_iniciar),
            costo_general: parseFloat(r.costo_general),
            costo_reducido: parseFloat(r.costo_reducido),
            pago_minimo: parseFloat(r.pago_minimo)
        }));
    },

    // Buscar una oferta específica por su ID
    findById: async (id) => {
        const sql = `
            SELECT 
                oc.id,
                oc.curso_id,
                c.nombre AS curso_nombre,
                c.periodo AS curso_periodo,
                c.instructor AS curso_instructor,
                oc.paralelo,
                oc.costo_general,
                oc.costo_reducido,
                oc.pago_minimo,
                oc.cupo_minimo,
                oc.cupo_maximo,
                oc.fecha_limite,
                oc.estado,
                oc.created_at,
                COUNT(CASE WHEN p.estado IN ('reservada', 'matriculada') THEN 1 END) AS total_ocupados,
                COUNT(CASE WHEN p.estado = 'reservada' THEN 1 END) AS total_reservados,
                COUNT(CASE WHEN p.estado = 'matriculada' THEN 1 END) AS total_matriculados,
                (oc.cupo_maximo - COUNT(CASE WHEN p.estado IN ('reservada', 'matriculada') THEN 1 END)) AS cupos_disponibles,
                IF(COUNT(CASE WHEN p.estado IN ('reservada', 'matriculada') THEN 1 END) >= oc.cupo_minimo, 1, 0) AS apto_iniciar
            FROM ofertas_curso oc
            INNER JOIN cursos c ON oc.curso_id = c.id
            LEFT JOIN prematriculas p ON p.oferta_id = oc.id
            WHERE oc.id = ?
            GROUP BY oc.id
        `;
        const [rows] = await db.query(sql, [id]);
        if (rows.length === 0) return null;

        const r = rows[0];
        return {
            ...r,
            apto_iniciar: Boolean(r.apto_iniciar),
            costo_general: parseFloat(r.costo_general),
            costo_reducido: parseFloat(r.costo_reducido),
            pago_minimo: parseFloat(r.pago_minimo)
        };
    },

    // Crear una nueva oferta de curso con validación de Reglas de Negocio (RN-08)
    create: async (data) => {
        const {
            curso_id,
            paralelo,
            costo_general,
            costo_reducido,
            pago_minimo,
            cupo_minimo = 15,
            cupo_maximo = 20,
            fecha_limite,
            estado = 'abierta'
        } = data;

        // Validaciones numéricas (RN-08)
        const cGen = parseFloat(costo_general);
        const cRed = parseFloat(costo_reducido);
        const pMin = parseFloat(pago_minimo);
        const qMin = parseInt(cupo_minimo, 10);
        const qMax = parseInt(cupo_maximo, 10);

        if (!curso_id || !paralelo) {
            throw new Error('El curso y el código del paralelo son obligatorios.');
        }

        if (isNaN(cGen) || cGen <= 0 || isNaN(cRed) || cRed <= 0 || isNaN(pMin) || pMin <= 0) {
            throw new Error('RN-08: Los costos y el pago mínimo deben ser mayores a cero.');
        }

        if (cRed > cGen) {
            throw new Error('RN-08: El costo reducido no puede ser superior al costo general.');
        }

        if (pMin >= cRed) {
            throw new Error('RN-08: El pago mínimo de reserva debe ser menor al costo del curso.');
        }

        if (isNaN(qMin) || isNaN(qMax) || qMin <= 0 || qMax < qMin) {
            throw new Error('RN-08: El cupo máximo debe ser mayor o igual al cupo mínimo requerido.');
        }

        // Verificar existencia del curso en el catálogo base
        const [cursoExists] = await db.query('SELECT id FROM cursos WHERE id = ?', [curso_id]);
        if (cursoExists.length === 0) {
            throw new Error('El curso seleccionado no existe en el catálogo.');
        }

        // Verificar que no exista ya ese paralelo para el mismo curso
        const [duplicate] = await db.query(
            'SELECT id FROM ofertas_curso WHERE curso_id = ? AND paralelo = ?',
            [curso_id, paralelo.trim().toUpperCase()]
        );
        if (duplicate.length > 0) {
            throw new Error(`Ya existe el paralelo ${paralelo.trim().toUpperCase()} para este curso.`);
        }

        const [result] = await db.query(
            `INSERT INTO ofertas_curso (
                curso_id, paralelo, costo_general, costo_reducido, pago_minimo,
                cupo_minimo, cupo_maximo, fecha_limite, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                curso_id,
                paralelo.trim().toUpperCase(),
                cGen,
                cRed,
                pMin,
                qMin,
                qMax,
                fecha_limite || null,
                estado
            ]
        );

        return await Oferta.findById(result.insertId);
    },

    // Actualizar una oferta existente
    update: async (id, data) => {
        const ofertaActual = await Oferta.findById(id);
        if (!ofertaActual) {
            throw new Error('La oferta de curso no existe.');
        }

        const {
            paralelo,
            costo_general,
            costo_reducido,
            pago_minimo,
            cupo_minimo,
            cupo_maximo,
            fecha_limite,
            estado
        } = data;

        const cGen = costo_general !== undefined ? parseFloat(costo_general) : ofertaActual.costo_general;
        const cRed = costo_reducido !== undefined ? parseFloat(costo_reducido) : ofertaActual.costo_reducido;
        const pMin = pago_minimo !== undefined ? parseFloat(pago_minimo) : ofertaActual.pago_minimo;
        const qMin = cupo_minimo !== undefined ? parseInt(cupo_minimo, 10) : ofertaActual.cupo_minimo;
        const qMax = cupo_maximo !== undefined ? parseInt(cupo_maximo, 10) : ofertaActual.cupo_maximo;

        if (cGen <= 0 || cRed <= 0 || pMin <= 0) {
            throw new Error('RN-08: Los costos deben ser mayores a cero.');
        }
        if (cRed > cGen) {
            throw new Error('RN-08: El costo reducido no puede superar al general.');
        }
        if (qMax < qMin) {
            throw new Error('RN-08: El cupo máximo no puede ser menor al cupo mínimo.');
        }

        // Si cambia el paralelo, verificar duplicado
        if (paralelo && paralelo.trim().toUpperCase() !== ofertaActual.paralelo) {
            const [duplicate] = await db.query(
                'SELECT id FROM ofertas_curso WHERE curso_id = ? AND paralelo = ? AND id != ?',
                [ofertaActual.curso_id, paralelo.trim().toUpperCase(), id]
            );
            if (duplicate.length > 0) {
                throw new Error(`Ya existe el paralelo ${paralelo.trim().toUpperCase()} para este curso.`);
            }
        }

        await db.query(
            `UPDATE ofertas_curso SET
                paralelo = ?,
                costo_general = ?,
                costo_reducido = ?,
                pago_minimo = ?,
                cupo_minimo = ?,
                cupo_maximo = ?,
                fecha_limite = ?,
                estado = ?
             WHERE id = ?`,
            [
                paralelo ? paralelo.trim().toUpperCase() : ofertaActual.paralelo,
                cGen,
                cRed,
                pMin,
                qMin,
                qMax,
                fecha_limite !== undefined ? fecha_limite : ofertaActual.fecha_limite,
                estado || ofertaActual.estado,
                id
            ]
        );

        return await Oferta.findById(id);
    },

    // Eliminar o cancelar oferta
    delete: async (id) => {
        const [prematriculas] = await db.query('SELECT COUNT(*) AS total FROM prematriculas WHERE oferta_id = ?', [id]);
        if (prematriculas[0].total > 0) {
            // Si ya tiene reservas, no se borra físicamente: se cancela (RN)
            await db.query("UPDATE ofertas_curso SET estado = 'cancelada' WHERE id = ?", [id]);
            return { cancelada: true, message: 'La oferta tiene pre-matrículas registradas y fue cambiada a estado cancelada.' };
        }

        const [result] = await db.query('DELETE FROM ofertas_curso WHERE id = ?', [id]);
        return { eliminada: result.affectedRows > 0 };
    }
};

module.exports = Oferta;
