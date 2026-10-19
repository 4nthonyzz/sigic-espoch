const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sigic_espoch_jwt_secret_key_cisco_2026';

const authController = {
    // Registro de nuevo usuario (estudiante o administrador)
    registro: async (req, res) => {
        try {
            const { correo, password, nombres, cedula, rol } = req.body;

            // Validaciones mínimas
            if (!correo || !password || !nombres) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos correo, contraseña y nombres son obligatorios.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres.'
                });
            }

            // Crear usuario en base de datos (con hashing bcrypt y asignación de tarifa)
            const nuevoUsuario = await Usuario.create({
                correo,
                password,
                nombres,
                cedula,
                rol: rol === 'admin' ? 'admin' : 'estudiante'
            });

            // Generar token JWT con vigencia de 24 horas
            const token = jwt.sign(
                { id: nuevoUsuario.id, correo: nuevoUsuario.correo, rol: nuevoUsuario.rol, tarifa: nuevoUsuario.tarifa },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    usuario: nuevoUsuario,
                    token
                }
            });
        } catch (error) {
            const status = error.message.includes('ya se encuentra registrado') ? 409 : 500;
            res.status(status).json({ success: false, error: error.message });
        }
    },

    // Inicio de sesión y generación de token JWT
    login: async (req, res) => {
        try {
            const { correo, password } = req.body;

            if (!correo || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Debe ingresar correo y contraseña.'
                });
            }

            const usuario = await Usuario.findByCorreo(correo);
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas. Correo no registrado.'
                });
            }

            const passwordValida = await Usuario.comparePassword(password, usuario.password_hash);
            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas. Contraseña incorrecta.'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                { id: usuario.id, correo: usuario.correo, rol: usuario.rol, tarifa: usuario.tarifa },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    usuario: {
                        id: usuario.id,
                        correo: usuario.correo,
                        nombres: usuario.nombres,
                        cedula: usuario.cedula,
                        rol: usuario.rol,
                        tarifa: usuario.tarifa
                    },
                    token
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Obtener perfil del usuario autenticado actual
    perfil: async (req, res) => {
        try {
            const usuario = await Usuario.findById(req.usuario.id);
            if (!usuario) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }
            res.json({ success: true, data: usuario });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = authController;
