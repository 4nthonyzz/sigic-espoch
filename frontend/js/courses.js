// SIGIC-ESPOCH - Módulo de Cursos

let cursosData = [];

async function cargarCursos() {
    const container = document.getElementById('cursos-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando cursos...</div>';
    
    try {
        const response = await API.get('/cursos');
        console.log('📚 Cursos cargados:', response);
        
        if (response.success && response.data) {
            cursosData = response.data;
            renderCursos(cursosData);
        } else {
            container.innerHTML = '<div class="error">❌ Error al cargar los cursos</div>';
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
        container.innerHTML = '<div class="error">❌ Error de conexión con el servidor</div>';
    }
}

function renderCursos(cursos) {
    const container = document.getElementById('cursos-container');
    
    if (!cursos || cursos.length === 0) {
        container.innerHTML = '<div class="loading">No hay cursos registrados</div>';
        return;
    }
    
    container.innerHTML = cursos.map(c => {
        const porcentaje = Math.min(100, (c.participantes / 30) * 100);
        const estadoClass = c.estado === 'activo' ? 'activo' : 
                           (c.estado === 'finalizado' ? 'finalizado' : 'cancelado');
        return `
            <div class="course-card">
                <div class="course-header">
                    <h3>${c.nombre || 'Curso sin nombre'}</h3>
                    <span class="course-status ${estadoClass}">${c.estado || 'N/A'}</span>
                </div>
                <div class="course-body">
                    <p><i class="fas fa-users"></i> <strong>${c.participantes || 0}</strong> estudiantes inscritos</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${porcentaje}%;"></div>
                    </div>
                    <small style="color:#6c757d;">Capacidad máxima: 30 estudiantes</small>
                </div>
            </div>
        `;
    }).join('');
}

// Agregar curso
document.getElementById('btn-agregar-curso')?.addEventListener('click', function() {
    document.getElementById('modal-curso-title').textContent = 'Nuevo Curso';
    document.getElementById('form-curso').reset();
    document.getElementById('curso-id').value = '';
    document.getElementById('modal-curso').style.display = 'block';
});

document.getElementById('form-curso')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const data = {
        nombre: document.getElementById('curso-nombre').value,
        participantes: parseInt(document.getElementById('curso-participantes').value) || 0
    };
    
    try {
        const response = await API.post('/cursos', data);
        if (response.success) {
            alert('✅ Curso creado exitosamente');
            document.getElementById('modal-curso').style.display = 'none';
            cargarCursos();
            cargarDashboard();
        } else {
            alert('❌ Error: ' + (response.error || 'No se pudo crear el curso'));
        }
    } catch (error) {
        alert('❌ Error al crear el curso');
        console.error(error);
    }
});