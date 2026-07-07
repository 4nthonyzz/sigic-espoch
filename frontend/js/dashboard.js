// SIGIC-ESPOCH - Módulo de Dashboard

let dashboardCharts = {};

async function cargarDashboard() {
    console.log('🔄 Cargando dashboard...');
    
    try {
        // Obtener datos de bienes
        const bienesData = await API.get('/bienes');
        console.log('📦 Bienes recibidos:', bienesData);
        
        if (bienesData.success && bienesData.data) {
            const bienes = bienesData.data;
            
            // Actualizar estadísticas
            document.getElementById('total-activos').textContent = bienes.length;
            
            const criticos = bienes.filter(b => b.estado === 'CRÍTICO').length;
            document.getElementById('alertas-mantenimiento').textContent = criticos;
            
            // Calcular distribución por categoría
            const routers = bienes.filter(b => b.nombre && b.nombre.toLowerCase().includes('router')).length;
            const switches = bienes.filter(b => b.nombre && b.nombre.toLowerCase().includes('switch')).length;
            const accesorios = bienes.filter(b => b.nombre && (b.nombre.toLowerCase().includes('cable') || b.nombre.toLowerCase().includes('adaptador') || b.nombre.toLowerCase().includes('kit') || b.nombre.toLowerCase().includes('soporte'))).length;
            const otros = bienes.length - routers - switches - accesorios;
            
            // Estado de equipos
            const buenos = bienes.filter(b => b.estado === 'BUENO').length;
            const regulares = bienes.filter(b => b.estado === 'REGULAR').length;
            
            // Graficar distribución
            const ctx1 = document.getElementById('activosChart').getContext('2d');
            if (dashboardCharts.activos) dashboardCharts.activos.destroy();
            dashboardCharts.activos = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: ['Routers', 'Switches', 'Accesorios', 'Otros'],
                    datasets: [{
                        label: 'Cantidad de Equipos',
                        data: [routers, switches, accesorios, otros],
                        backgroundColor: ['#CC0000', '#1A7A3A', '#CC9900', '#8B1A1A'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
            
            // Graficar estados
            const ctx2 = document.getElementById('estadoChart').getContext('2d');
            if (dashboardCharts.estado) dashboardCharts.estado.destroy();
            dashboardCharts.estado = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Bueno', 'Regular', 'Crítico'],
                    datasets: [{
                        data: [buenos, regulares, criticos],
                        backgroundColor: ['#1A7A3A', '#CC9900', '#CC0000'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        
        // Obtener datos de cursos
        const cursosData = await API.get('/cursos');
        console.log('📚 Cursos recibidos:', cursosData);
        
        if (cursosData.success && cursosData.data) {
            const cursos = cursosData.data;
            const activos = cursos.filter(c => c.estado === 'activo').length;
            const estudiantes = cursos.reduce((sum, c) => sum + (c.participantes || 0), 0);
            document.getElementById('cursos-activos').textContent = activos;
            document.getElementById('estudiantes-total').textContent = estudiantes;
        }
        
        // Actividad reciente
        document.getElementById('activity-tbody').innerHTML = `
            <tr>
                <td><strong>Vinicio Ramos</strong><br><small>Coordinador CISCO</small></td>
                <td>Router CISCO 2911</td>
                <td><span class="status-badge prestado">En uso</span></td>
                <td>Hoy, 10:15</td>
            </tr>
        `;
        
    } catch (error) {
        console.error('❌ Error en cargarDashboard:', error);
    }
}