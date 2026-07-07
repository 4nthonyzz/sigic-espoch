// SIGIC-ESPOCH - Módulo de Autenticación

// Credenciales de usuarios reales
const AUTH_USERS = {
    custodio: {
        username: 'vinicio.ramos@espoch.edu.ec',
        password: '0602899684',
        name: 'Vinicio Ramos Valencia',
        role: 'Custodio / Coordinador CISCO',
        role_code: 'custodio',
        cedula: '0602899684'
    },
    admin: {
        username: 'admin@espoch.edu.ec',
        password: 'admin2026',
        name: 'Administrador SIGIC',
        role: 'Administrador',
        role_code: 'admin'
    }
};

// Función para autenticar usuario
function autenticarUsuario(username, password) {
    for (let key in AUTH_USERS) {
        if (AUTH_USERS[key].username === username && AUTH_USERS[key].password === password) {
            return AUTH_USERS[key];
        }
    }
    return null;
}

// Función para establecer sesión
function iniciarSesion(user) {
    const session = {
        user: user,
        loggedIn: true,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('sigic_session', JSON.stringify(session));
    return true;
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sigic_session');
    window.location.href = 'index.html';
}

// Función para verificar sesión activa
function verificarSesion() {
    const session = JSON.parse(localStorage.getItem('sigic_session') || '{}');
    if (!session.loggedIn) {
        window.location.href = 'index.html';
    }
    return session;
}

// Función para obtener usuario actual
function getUsuarioActual() {
    const session = JSON.parse(localStorage.getItem('sigic_session') || '{}');
    return session.user || null;
}