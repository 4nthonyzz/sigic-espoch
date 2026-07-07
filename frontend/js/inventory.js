// SIGIC-ESPOCH - Módulo de Inventario

let inventarioData = [];

async function cargarInventario() {
    const tbody = document.getElementById('inventario-body');
    tbody.innerHTML = '<tr><td colspan="10" class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando equipos...</td></tr>';
    
    try {
        const response = await API.get('/bienes');
        console.log('📦 Inventario cargado:', response);
        
        if (response.success && response.data) {
            inventarioData = response.data;
            renderInventario(inventarioData);
        } else {
            tbody.innerHTML = '<tr><td colspan="10" class="error">❌ Error al cargar los equipos</td></tr>';
        }
    } catch (error) {
        console.error('Error cargando inventario:', error);
        tbody.innerHTML = '<tr><td colspan="10" class="error">❌ Error de conexión con el servidor</td></tr>';
    }
}

function renderInventario(data) {
    const tbody = document.getElementById('inventario-body');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">No hay equipos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(b => {
        const estadoClass = b.estado === 'BUENO' ? 'estado-bueno' : 
                           (b.estado === 'REGULAR' ? 'estado-regular' : 'estado-critico');
        return `
            <tr>
                <td><strong>${b.codigo || 'N/A'}</strong></td>
                <td>
                    <strong>${b.nombre || 'N/A'}</strong>
                    <br><small style="color:#6c757d;">${b.serie || ''}</small>
                </td>
                <td>
                    <strong>${b.modelo || 'N/A'}</strong>
                    <br><small style="color:#6c757d;">${b.marca || ''}</small>
                </td>
                <td>
                    <strong>${b.ubicacion || 'No asignada'}</strong>
                    <br><small style="color:#6c757d;">${b.bodega || ''}</small>
                </td>
                <td>$${parseFloat(b.valor_contable || 0).toFixed(2)}</td>
                <td>${parseFloat(b.porcentaje_depreciacion || 0).toFixed(1)}%</td>
                <td><span class="estado-badge ${estadoClass}">${b.estado || 'N/A'}</span></td>
                <td>
                    <button class="btn-icon-sm btn-edit" onclick="editarBien(${b.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-sm btn-delete" onclick="eliminarBien(${b.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filtros
document.getElementById('search-equipo')?.addEventListener('input', function() {
    const term = this.value.toLowerCase();
    const filtered = inventarioData.filter(b => 
        (b.codigo && b.codigo.toLowerCase().includes(term)) ||
        (b.nombre && b.nombre.toLowerCase().includes(term)) ||
        (b.marca && b.marca.toLowerCase().includes(term)) ||
        (b.serie && b.serie.toLowerCase().includes(term))
    );
    renderInventario(filtered);
});

document.getElementById('filter-estado')?.addEventListener('change', function() {
    const estado = this.value;
    if (!estado) {
        renderInventario(inventarioData);
        return;
    }
    const filtered = inventarioData.filter(b => b.estado === estado);
    renderInventario(filtered);
});

// Modal para agregar bien
document.getElementById('btn-agregar-bien')?.addEventListener('click', function() {
    document.getElementById('modal-title').textContent = 'Agregar Equipo';
    document.getElementById('form-bien').reset();
    document.getElementById('bien-id').value = '';
    document.getElementById('modal-bien').style.display = 'block';
});

// Cerrar modales
document.querySelectorAll('.close').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.getElementById('modal-bien').style.display = 'none';
        document.getElementById('modal-curso').style.display = 'none';
    });
});

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// ============================================
// GUARDAR BIEN (CREAR O EDITAR) - CON TODOS LOS CAMPOS
// ============================================
document.getElementById('form-bien')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const bienId = document.getElementById('bien-id').value;
    const data = {
        codigo: document.getElementById('codigo').value,
        codigo_anterior: document.getElementById('codigo_anterior')?.value || null,
        nombre: document.getElementById('nombre').value,
        serie: document.getElementById('serie').value || null,
        modelo: document.getElementById('modelo')?.value || null,
        marca: document.getElementById('marca').value || null,
        bodega: document.getElementById('bodega')?.value || null,
        ubicacion: document.getElementById('ubicacion').value || null,
        tipo_registro: document.getElementById('tipo_registro')?.value || null,
        fecha_ingreso: document.getElementById('fecha_ingreso').value || null,
        fecha_asignacion: document.getElementById('fecha_asignacion')?.value || null,
        numero_acta: document.getElementById('numero_acta')?.value || null,
        cantidad: parseInt(document.getElementById('cantidad')?.value) || 1,
        valor_contable: parseFloat(document.getElementById('valor_contable').value) || 0,
        depreciacion_acumulada: parseFloat(document.getElementById('depreciacion_acumulada').value) || 0,
        estado_manual: document.getElementById('estado_manual')?.value || null
    };
    
    try {
        let response;
        if (bienId) {
            response = await API.put(`/bienes/${bienId}`, data);
        } else {
            response = await API.post('/bienes', data);
        }
        
        if (response.success) {
            alert('✅ Equipo guardado exitosamente');
            document.getElementById('modal-bien').style.display = 'none';
            cargarInventario();
            cargarDashboard();
        } else {
            alert('❌ Error: ' + (response.error || 'No se pudo guardar'));
        }
    } catch (error) {
        alert('❌ Error al guardar el equipo');
        console.error(error);
    }
});

// ============================================
// EDITAR BIEN - CON TODOS LOS CAMPOS
// ============================================
window.editarBien = async function(id) {
    try {
        const response = await API.get(`/bienes/${id}`);
        if (response.success && response.data) {
            const b = response.data;
            
            document.getElementById('modal-title').textContent = 'Editar Equipo';
            document.getElementById('bien-id').value = b.id;
            document.getElementById('codigo').value = b.codigo || '';
            if (document.getElementById('codigo_anterior')) {
                document.getElementById('codigo_anterior').value = b.codigo_anterior || '';
            }
            document.getElementById('nombre').value = b.nombre || '';
            document.getElementById('serie').value = b.serie || '';
            if (document.getElementById('modelo')) {
                document.getElementById('modelo').value = b.modelo || '';
            }
            document.getElementById('marca').value = b.marca || '';
            if (document.getElementById('bodega')) {
                document.getElementById('bodega').value = b.bodega || '';
            }
            document.getElementById('ubicacion').value = b.ubicacion || '';
            if (document.getElementById('tipo_registro')) {
                document.getElementById('tipo_registro').value = b.tipo_registro || '';
            }
            document.getElementById('fecha_ingreso').value = b.fecha_ingreso ? b.fecha_ingreso.split('T')[0] : '';
            if (document.getElementById('fecha_asignacion')) {
                document.getElementById('fecha_asignacion').value = b.fecha_asignacion ? b.fecha_asignacion.split('T')[0] : '';
            }
            if (document.getElementById('numero_acta')) {
                document.getElementById('numero_acta').value = b.numero_acta || '';
            }
            if (document.getElementById('cantidad')) {
                document.getElementById('cantidad').value = b.cantidad || 1;
            }
            document.getElementById('valor_contable').value = b.valor_contable || 0;
            document.getElementById('depreciacion_acumulada').value = b.depreciacion_acumulada || 0;
            if (document.getElementById('estado_manual')) {
                document.getElementById('estado_manual').value = b.estado_manual || '';
            }
            
            document.getElementById('modal-bien').style.display = 'block';
        }
    } catch (error) {
        alert('❌ Error al cargar los datos del equipo');
        console.error(error);
    }
};

// ============================================
// ELIMINAR BIEN (SOFT DELETE)
// ============================================
window.eliminarBien = async function(id) {
    if (!confirm('¿Estás seguro de dar de baja este equipo?')) return;
    
    try {
        const response = await API.delete(`/bienes/${id}`);
        if (response.success) {
            alert('✅ Equipo dado de baja exitosamente');
            cargarInventario();
            cargarDashboard();
        } else {
            alert('❌ Error: ' + (response.error || 'No se pudo eliminar'));
        }
    } catch (error) {
        alert('❌ Error al eliminar el equipo');
        console.error(error);
    }
};