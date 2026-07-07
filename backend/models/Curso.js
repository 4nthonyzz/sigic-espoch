const db = require('../config/database');

const Curso = {
    // Obtener todos los cursos
    findAll: async () => {
        const [rows] = await db.query('SELECT * FROM cursos ORDER BY created_at DESC');
        return rows;
    },

    // Obtener curso por ID
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM cursos WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return rows[0];
    },

    // Crear un nuevo curso
    create: async (cursoData) => {
        const { nombre, participantes, instructor, periodo, estado } = cursoData;

        if (!nombre) {
            throw new Error('El nombre del curso es obligatorio');
        }

        if (participantes !== undefined && participantes < 0) {
            throw new Error('RN-03: Los participantes no pueden ser negativos');
        }

        const validEstados = ['activo', 'finalizado', 'cancelado'];
        const finalEstado = estado || 'activo';
        if (!validEstados.includes(finalEstado)) {
            throw new Error('Estado inválido');
        }

        const [result] = await db.query(
            'INSERT INTO cursos (nombre, participantes, instructor, periodo, estado) VALUES (?, ?, ?, ?, ?)',
            [nombre, participantes || 0, instructor || null, periodo || null, finalEstado]
        );

        return {
            id: result.insertId,
            nombre,
            participantes: participantes || 0,
            instructor: instructor || null,
            periodo: periodo || null,
            estado: finalEstado
        };
    },

    // Actualizar un curso existente
    update: async (id, cursoData) => {
        const { nombre, participantes, estado } = cursoData;

        if (nombre === '') {
            throw new Error('El nombre del curso no puede estar vacío');
        }

        if (participantes !== undefined && participantes < 0) {
            throw new Error('RN-03: Los participantes no pueden ser negativos');
        }

        if (estado !== undefined) {
            const validEstados = ['activo', 'finalizado', 'cancelado'];
            if (!validEstados.includes(estado)) {
                throw new Error('Estado inválido');
            }
        }

        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(cursoData)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            const [existing] = await db.query('SELECT id FROM cursos WHERE id = ?', [id]);
            return existing.length > 0;
        }

        values.push(id);
        const [result] = await db.query(
            `UPDATE cursos SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    },

    // Eliminar un curso
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM cursos WHERE id = ?', [id]);
        console.log('Delete result:', { affectedRows: result.affectedRows, changedRows: result.changedRows });
        return result.affectedRows > 0;
    }
};

module.exports = Curso;
