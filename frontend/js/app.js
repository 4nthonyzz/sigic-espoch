// SIGIC-ESPOCH - Aplicación Principal

// Configuración de API
const API_BASE_URL = 'http://localhost:3002/api';

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
        
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));
        document.getElementById(`${module}-module`).classList.add('active');
        
        if (module === 'inventario') {
            if (typeof cargarInventario === 'function') cargarInventario();
        } else if (module === 'cursos') {
            if (typeof cargarCursos === 'function') cargarCursos();
        } else if (module === 'dashboard') {
            if (typeof cargarDashboard === 'function') cargarDashboard();
        }
    });
});

// Refresh button
document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const activeModule = document.querySelector('.module.active').id;
    if (activeModule === 'dashboard-module' && typeof cargarDashboard === 'function') {
        cargarDashboard();
    } else if (activeModule === 'inventario-module' && typeof cargarInventario === 'function') {
        cargarInventario();
    } else if (activeModule === 'cursos-module' && typeof cargarCursos === 'function') {
        cargarCursos();
    }
});



// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    if (typeof cargarDashboard === 'function') cargarDashboard();
    if (typeof cargarInventario === 'function') cargarInventario();
    if (typeof cargarCursos === 'function') cargarCursos();
});