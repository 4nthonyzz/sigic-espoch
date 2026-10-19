const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sigic_espoch_jwt_secret_key_cisco_2026';

const authMiddleware = {
    // Middleware para verificar la validez del token JWT
    verificarToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Acceso no autorizado. Token no proporcionado.'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.usuario = decoded;
            next();
        } catch (error) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido o expirado. Por favor inicie sesión nuevamente.'
            });
        }
    },

    // Middleware para verificar si el usuario tiene rol de Administrador
    esAdmin: (req, res, next) => {
        if (!req.usuario || req.usuario.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Permiso denegado. Se requiere rol de Administrador.'
            });
        }
        next();
    }
};

module.exports = authMiddleware;
