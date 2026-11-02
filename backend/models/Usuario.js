const db = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = {
    // Buscar usuario por correo electrónico
    findByCorreo: async (correo) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo.trim().toLowerCase()]);
        return rows.length > 0 ? rows[0] : null;
    },

    // Buscar usuario por ID
    findById: async (id) => {
        const [rows] = await db.query(
            'SELECT id, correo, nombres, cedula, rol, tarifa, created_at FROM usuarios WHERE id = ?',
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    // Registrar nuevo usuario
    create: async ({ correo, password, nombres, cedula, rol = 'estudiante' }) => {
        const cleanCorreo = correo.trim().toLowerCase();

        // Validar si el correo ya existe
        const existente = await Usuario.findByCorreo(cleanCorreo);
        if (existente) {
            throw new Error('El correo electrónico ya se encuentra registrado');
        }

        // Regla de Negocio: Evaluación de tarifa estrictamente en servidor
        // Correo institucional (@espoch.edu.ec) -> tarifa institucional, otros -> tarifa general
        const tarifa = cleanCorreo.endsWith('@espoch.edu.ec') ? 'institucional' : 'general';

        // Cifrado de contraseña con bcrypt (costo 10)
        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO usuarios (correo, password_hash, nombres, cedula, rol, tarifa)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [cleanCorreo, password_hash, nombres.trim(), cedula ? cedula.trim() : null, rol, tarifa]
        );

        return {
            id: result.insertId,
            correo: cleanCorreo,
            nombres: nombres.trim(),
            cedula: cedula ? cedula.trim() : null,
            rol,
            tarifa
        };
    },

    // Comparar contraseña con el hash almacenado
    comparePassword: async (passwordPlana, hashAlmacenado) => {
        return await bcrypt.compare(passwordPlana, hashAlmacenado);
    }
};

module.exports = Usuario;
