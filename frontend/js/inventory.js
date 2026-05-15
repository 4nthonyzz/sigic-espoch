// SIGIC-ESPOCH - Módulo de Inventario
// Cumple con RF-01, RF-02, RF-03, RF-04, RF-05

let inventarioData = [];

// Cargar inventario desde la API
async function cargarInventario() {
    const tbody = document.getElementById('inventario-body');
    tbody.innerHTML = '<tr><td colspan="9" class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando inventario...</td></tr>';
    
    try {
        const response = await API.get('/bienes');
        
        if (response.success && response.data) {
            inventarioData = response.data;
            renderInventario(inventarioData);
        } else {
            // Datos de demostración para visualización
            mostrarDatosDemostracion();
        }
    } catch (error) {
        console.error('Error cargando inventario:', error);
        mostrarDatosDemostracion();
    }
}

// Mostrar datos de demostración (cuando el backend no está disponible)
function mostrarDatosDemostracion() {
    const equiposDemo = [
        { id: 1, codigo: 'RTR-001', nombre: 'Router Cisco 4331', serie: 'FGL22102ABC', modelo: '4331', marca: 'Cisco', valor_contable: 2500, depreciacion_acumulada: 500, porcentaje_depreciacion: 20, estado: 'BUENO', ubicacion: 'RACK-A1' },
        { id: 2, codigo: 'SW-002', nombre: 'Switch Cisco 2960', serie: 'FD02149Z0A1', modelo: '2960', marca: 'Cisco', valor_contable: 1200, depreciacion_acumulada: 300, porcentaje_depreciacion: 25, estado: 'BUENO', ubicacion: 'RACK-B2' },
        { id: 3, codigo: 'ACC-003', nombre: 'Console Cable Bundle', serie: 'KIT-CC-09', modelo: 'CAB-CONSOLE', marca: 'Cisco', valor_contable: 45, depreciacion_acumulada: 5, porcentaje_depreciacion: 11.11, estado: 'BUENO', ubicacion: 'LAB-A' },
        { id: 4, codigo: 'RTR-004', nombre: 'Router Cisco 2901', serie: 'FGL19123XYZ', modelo: '2901', marca: 'Cisco', valor_contable: 1800, depreciacion_acumulada: 1600, porcentaje_depreciacion: 88.89, estado: 'REGULAR', ubicacion: 'RACK-A1' },
        { id: 5, codigo: 'SW-005', nombre: 'Switch Cisco 3750', serie: 'FD02873B2C', modelo: '3750', marca: 'Cisco', valor_contable: 950, depreciacion_acumulada: 920, porcentaje_depreciacion: 96.84, estado: 'CRÍTICO', ubicacion: 'RACK-B2' }
    ];
    
    inventarioData = equiposDemo;
    renderInventario(inventarioData);
}

// Renderizar tabla de inventario
function renderInventario(data) {
    const tbody = document.getElementById('inventario-body');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No hay equipos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(bien => `
        <tr>
            <td><input type="checkbox" class="select-item" data-id="${bien.id}"></td>
            <td><strong>${escapeHtml(bien.codigo)}</strong></td>
            <td>
                <strong>${escapeHtml(bien.nombre)}</strong><br>
                <small style="color: #666;">${escapeHtml(bien.modelo || '')} / ${escapeHtml(bien.marca || '')}</small>
            </td>
            <td><small>${escapeHtml(bien.serie || 'N/A')}</small></td>
            <td>$${Number(bien.valor_contable).toFixed(2)}</td>
            <td>${Number(bien.porcentaje_depreciacion || 0).toFixed(1)}%</td>
            <td>${getEstadoBadge(bien.estado)}</td>
            <td>${escapeHtml(bien.ubicacion || 'No asignada')}</td>
            <td class="action-buttons">
                <button class="btn-icon-sm btn-edit" onclick="editarBien(${bien.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-sm btn-delete" onclick="eliminarBien(${bien.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Actualizar contador de selección
    actualizarSelectorTodos();
}

// Obtener badge de estado según tipo
function getEstadoBadge(estado) {
    const clases = {
        'BUENO': 'estado-bueno',
        'REGULAR': 'estado-regular',
        'CRÍTICO': 'estado-critico'
    };
    const textos = {
        'BUENO': '✓ Bueno',
        'REGULAR': '⚠ Regular',
        'CRÍTICO': '🔴 Crítico'
    };
    return `<span class="estado-badge ${clases[estado] || 'estado-regular'}">${textos[estado] || estado}</span>`;
}

// Escapar HTML para prevenir XSS (RNF-05)
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Abrir modal para agregar bien
document.getElementById('btn-agregar-bien')?.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Agregar Equipo';
    document.getElementById('form-bien').reset();
    document.getElementById('bien-id').value = '';
    document.getElementById('modal-bien').style.display = 'block';
});

// Cerrar modales
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        document.getElementById('modal-bien').style.display = 'none';
        document.getElementById('modal-curso').style.display = 'none';
        document.getElementById('modal-prestamo').style.display = 'none';
    });
});

// Cerrar modal al hacer click fuera
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Guardar bien (crear o actualizar)
document.getElementById('form-bien')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bienId = document.getElementById('bien-id').value;
    const bienData = {
        codigo: document.getElementById('codigo').value,
        nombre: document.getElementById('nombre').value,
        serie: document.getElementById('serie').value,
        modelo: document.getElementById('modelo')?.value || '',
        marca: document.getElementById('marca').value,
        ubicacion: document.getElementById('ubicacion').value,
        valor_contable: parseFloat(document.getElementById('valor_contable').value),
        depreciacion_acumulada: parseFloat(document.getElementById('depreciacion_acumulada').value) || 0,
        custodio_id: parseInt(document.getElementById('custodio_id')?.value) || null
    };
    
    try {
        let response;
        if (bienId) {
            response = await API.put(`/bienes/${bienId}`, bienData);
        } else {
            response = await API.post('/bienes', bienData);
        }
        
        if (response.success) {
            alert(response.message || 'Equipo guardado exitosamente');
            document.getElementById('modal-bien').style.display = 'none';
            cargarInventario();
            if (typeof initDashboard === 'function') initDashboard();
        } else {
            alert('Error: ' + (response.error || 'No se pudo guardar el equipo'));
        }
    } catch (error) {
        console.error('Error guardando bien:', error);
        alert('Error al guardar. Verifica que el código sea único.');
    }
});

// Editar bien
window.editarBien = async (id) => {
    try {
        const response = await API.get(`/bienes/${id}`);
        if (response.success && response.data) {
            const bien = response.data;
            document.getElementById('modal-title').textContent = 'Editar Equipo';
            document.getElementById('bien-id').value = bien.id;
            document.getElementById('codigo').value = bien.codigo;
            document.getElementById('nombre').value = bien.nombre;
            document.getElementById('serie').value = bien.serie || '';
            document.getElementById('modelo').value = bien.modelo || '';
            document.getElementById('marca').value = bien.marca || '';
            document.getElementById('ubicacion').value = bien.ubicacion || '';
            document.getElementById('valor_contable').value = bien.valor_contable;
            document.getElementById('depreciacion_acumulada').value = bien.depreciacion_acumulada || 0;
            if (document.getElementById('custodio_id')) {
                document.getElementById('custodio_id').value = bien.custodio_id || '';
            }
            document.getElementById('modal-bien').style.display = 'block';
        }
    } catch (error) {
        console.error('Error cargando bien:', error);
        alert('Error al cargar los datos del equipo');
    }
};

// Eliminar bien (soft delete - RN-04)
window.eliminarBien = async (id) => {
    if (confirm('¿Estás seguro de dar de baja este equipo? (Soft Delete - El registro quedará en la base de datos)')) {
        try {
            const response = await API.delete(`/bienes/${id}`);
            if (response.success) {
                alert('Equipo dado de baja exitosamente');
                cargarInventario();
                if (typeof initDashboard === 'function') initDashboard();
            } else {
                alert('Error: ' + (response.error || 'No se pudo eliminar el equipo'));
            }
        } catch (error) {
            console.error('Error eliminando bien:', error);
            alert('Error al dar de baja el equipo');
        }
    }
};

// Filtros de inventario
document.getElementById('search-equipo')?.addEventListener('input', filtrarInventario);
document.getElementById('filter-estado')?.addEventListener('change', filtrarInventario);
document.getElementById('filter-categoria')?.addEventListener('change', filtrarInventario);

function filtrarInventario() {
    const searchTerm = document.getElementById('search-equipo')?.value.toLowerCase() || '';
    const estadoFiltro = document.getElementById('filter-estado')?.value || '';
    const categoriaFiltro = document.getElementById('filter-categoria')?.value || '';
    
    let filtered = [...inventarioData];
    
    if (searchTerm) {
        filtered = filtered.filter(bien => 
            (bien.codigo && bien.codigo.toLowerCase().includes(searchTerm)) ||
            (bien.nombre && bien.nombre.toLowerCase().includes(searchTerm)) ||
            (bien.serie && bien.serie.toLowerCase().includes(searchTerm))
        );
    }
    
    if (estadoFiltro) {
        filtered = filtered.filter(bien => bien.estado === estadoFiltro);
    }
    
    if (categoriaFiltro) {
        filtered = filtered.filter(bien => 
            (bien.nombre && bien.nombre.toLowerCase().includes(categoriaFiltro.toLowerCase()))
        );
    }
    
    renderInventario(filtered);
}

// Select all functionality
function actualizarSelectorTodos() {
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.select-item').forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }
}