// Dashboard Module - Gráficos y estadísticas

let activosChart = null;
let estadoChart = null;

// Inicializar dashboard
async function initDashboard() {
    await cargarEstadisticas();
    await cargarActividadReciente();
    actualizarFecha();
}

// Cargar estadísticas desde el backend
async function cargarEstadisticas() {
    try {
        const response = await API.get('/bienes/estadisticas');
        if (response.success) {
            const stats = response.data;
            
            document.getElementById('total-activos').textContent = stats.total_bienes || 0;
            document.getElementById('alertas-mantenimiento').textContent = stats.por_estado?.CRÍTICO || 0;
            
            // Cargar cursos para estudiantes totales
            const cursosResponse = await API.get('/cursos');
            if (cursosResponse.success) {
                const cursosActivos = cursosResponse.data.filter(c => c.estado === 'activo');
                document.getElementById('cursos-activos').textContent = cursosActivos.length;
                
                const totalEstudiantes = cursosResponse.data.reduce((sum, c) => sum + (c.participantes || 0), 0);
                document.getElementById('estudiantes-total').textContent = totalEstudiantes;
            }
            
            // Inicializar gráficos
            initCharts(stats);
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Datos de demostración
        document.getElementById('total-activos').textContent = '1,240';
        document.getElementById('cursos-activos').textContent = '15';
        document.getElementById('estudiantes-total').textContent = '350';
        document.getElementById('alertas-mantenimiento').textContent = '8';
        
        initDemoCharts();
    }
}

// Inicializar gráficos
function initCharts(stats) {
    // Gráfico de distribución por categoría (datos de ejemplo)
    const ctx1 = document.getElementById('activosChart').getContext('2d');
    
    if (activosChart) activosChart.destroy();
    
    activosChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Routers', 'Switches', 'Accesorios', 'Servidores', 'Otros'],
            datasets: [{
                label: 'Cantidad de Equipos',
                data: [45, 78, 32, 15, 28],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // Gráfico de estados
    const ctx2 = document.getElementById('estadoChart').getContext('2d');
    
    if (estadoChart) estadoChart.destroy();
    
    estadoChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Bueno', 'Regular', 'Crítico'],
            datasets: [{
                data: [
                    stats.por_estado?.BUENO || 0,
                    stats.por_estado?.REGULAR || 0,
                    stats.por_estado?.CRÍTICO || 0
                ],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Gráficos de demostración
function initDemoCharts() {
    const ctx1 = document.getElementById('activosChart').getContext('2d');
    
    activosChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Routers', 'Switches', 'Accesorios'],
            datasets: [{
                label: 'Cantidad',
                data: [12, 24, 18],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    const ctx2 = document.getElementById('estadoChart').getContext('2d');
    
    estadoChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Bueno (65%)', 'Regular (25%)', 'Crítico (10%)'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

// Cargar actividad reciente (préstamos)
async function cargarActividadReciente() {
    const tbody = document.getElementById('activity-tbody');
    
    // Datos de ejemplo según el diseño
    const actividades = [
        { usuario: 'John Doe', tipo: 'Estudiante', codigo: 'STU-9921', equipo: 'Switch Cisco 2960', serie: 'FD02149Z0A1', estado: 'Prestado', fecha: 'Hoy, 09:42 AM' },
        { usuario: 'Alan Smith', tipo: 'Profesor', codigo: 'FAC-104', equipo: 'Router Cisco 4331', serie: 'FGL22102ABC', estado: 'Devuelto', fecha: 'Ayer, 16:15 PM' },
        { usuario: 'Mary Jane', tipo: 'Estudiante', codigo: 'STU-8842', equipo: 'Console Cable Bundle', serie: 'KIT-CC-09', estado: 'Prestado', fecha: 'Ayer, 14:30 PM' },
        { usuario: 'Carlos Ruiz', tipo: 'Estudiante', codigo: 'STU-7753', equipo: 'Access Point Cisco', serie: 'AP-CISCO-01', estado: 'Prestado', fecha: 'Ayer, 11:20 AM' },
        { usuario: 'Laura Gómez', tipo: 'Profesor', codigo: 'FAC-205', equipo: 'Firewall Cisco ASA', serie: 'ASA-5506-X', estado: 'Devuelto', fecha: '2026-05-13' }
    ];
    
    tbody.innerHTML = actividades.map(act => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar">${act.usuario.charAt(0)}${act.usuario.split(' ')[1]?.charAt(0) || ''}</div>
                    <div>
                        <strong>${act.usuario}</strong><br>
                        <small style="font-size: 0.7rem; color: #666;">${act.tipo} - ${act.codigo}</small>
                    </div>
                </div>
            </td>
            <td>
                <strong>${act.equipo}</strong><br>
                <small style="font-size: 0.7rem; color: #666;">${act.serie}</small>
            </td>
            <td><span class="status-badge ${act.estado === 'Prestado' ? 'prestado' : 'devuelto'}">${act.estado}</span></td>
            <td>${act.fecha}</td>
        </tr>
    `).join('');
}

// Actualizar fecha actual
function actualizarFecha() {
    const fecha = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = fecha.toLocaleDateString('es-ES', options);
}

// Ver topología
document.getElementById('ver-topologia')?.addEventListener('click', () => {
    // Cambiar al módulo de topología
    document.querySelector('[data-module="topologia"]').click();
});