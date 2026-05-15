// SIGIC-ESPOCH - Aplicación Principal

// Configuración de API (ajustar según entorno)
const API_BASE_URL = '/api';

const API = {
    get: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        return response.json();
    },
    post: async (endpoint, data) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    put: async (endpoint, data) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    delete: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

// Navegación entre módulos
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const module = btn.dataset.module;
        
        // Actualizar active en navegación
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        btn.classList.add('active');
        
        // Mostrar módulo correspondiente
        document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));
        document.getElementById(`${module}-module`).classList.add('active');
        
        // Cargar datos específicos del módulo
        if (module === 'inventario') {
            if (typeof cargarInventario === 'function') cargarInventario();
        } else if (module === 'cursos') {
            if (typeof cargarCursos === 'function') cargarCursos();
        } else if (module === 'dashboard') {
            if (typeof initDashboard === 'function') initDashboard();
        }
    });
});

// Refresh button
document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const activeModule = document.querySelector('.module.active').id;
    if (activeModule === 'dashboard-module' && typeof initDashboard === 'function') {
        initDashboard();
    } else if (activeModule === 'inventario-module' && typeof cargarInventario === 'function') {
        cargarInventario();
    } else if (activeModule === 'cursos-module' && typeof cargarCursos === 'function') {
        cargarCursos();
    }
});

// Función para documentación (demo)
window.verDocumentacion = (tipo) => {
    alert(`📄 Documentación ${tipo.toUpperCase()}\n\nEl documento completo está disponible en el repositorio del proyecto.\n\nSIGIC-ESPOCH v1.0 - Cumple con IEEE Std 830-1998`);
};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    cargarInventario();
    cargarCursos();
});