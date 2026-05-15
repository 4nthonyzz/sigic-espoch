const db = require('../config/database');

// Función para calcular estado según RN-05 y RF-03
const calcularEstado = (valorContable, depreciacionAcumulada) => {
    if (valorContable <= 0) return 'CRÍTICO';
    
    const porcentaje = (depreciacionAcumulada / valorContable) * 100;
    
    if (porcentaje < 80) return 'BUENO';
    if (porcentaje >= 80 && porcentaje <= 95) return 'REGULAR';
    return 'CRÍTICO';
};

const Bien = {
    // RF-01: Visualización de inventario completo (solo activos)
    findAll: async () => {
        const [rows] = await db.query(`
            SELECT b.*, c.nombre_completo as custodio_nombre, c.cedula as custodio_cedula,
                   (b.depreciacion_acumulada / b.valor_contable * 100) as porcentaje_depreciacion
            FROM bienes b
            LEFT JOIN custodios c ON b.custodio_id = c.id
            WHERE b.activo = TRUE
            ORDER BY b.id DESC
        `);
        
        // Añadir estado calculado a cada bien
        return rows.map(bien => ({
            ...bien,
            estado: calcularEstado(bien.valor_contable, bien.depreciacion_acumulada),
            porcentaje_depreciacion: ((bien.depreciacion_acumulada / bien.valor_contable) * 100).toFixed(2)
        }));
    },
    
    // RF-02: Agregar nuevo bien con validación RN-01 y RN-02
    create: async (bienData) => {
        const { codigo, nombre, serie, modelo, marca, ubicacion, valor_contable, 
                depreciacion_acumulada, custodio_id, fecha_ingreso } = bienData;
        
        // Verificar unicidad de código (RN-01)
        const [existing] = await db.query('SELECT id FROM bienes WHERE codigo = ?', [codigo]);
        if (existing.length > 0) {
            throw new Error('El código del bien ya existe (RN-01)');
        }
        
        // Validar valor contable positivo (RN-02)
        if (valor_contable <= 0) {
            throw new Error('El valor contable debe ser mayor a cero (RN-02)');
        }
        
        // Validar depreciación no mayor a valor contable (RN-06)
        if (depreciacion_acumulada > valor_contable) {
            throw new Error('La depreciación acumulada no puede superar el valor contable (RN-06)');
        }
        
        const [result] = await db.query(`
            INSERT INTO bienes (codigo, nombre, serie, modelo, marca, ubicacion, 
                               valor_contable, depreciacion_acumulada, custodio_id, fecha_ingreso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [codigo, nombre, serie, modelo, marca, ubicacion, valor_contable, 
            depreciacion_acumulada || 0, custodio_id || null, fecha_ingreso || null]);
        
        return { id: result.insertId, ...bienData };
    },
    
    // RF-03: Cálculo automático de estado (método público)
    calcularEstado,
    
    // RF-04: Editar bien existente
    update: async (id, bienData) => {
        const { nombre, serie, modelo, marca, ubicacion, valor_contable, 
                depreciacion_acumulada, custodio_id } = bienData;
        
        // Validar valor contable positivo (RN-02)
        if (valor_contable && valor_contable <= 0) {
            throw new Error('El valor contable debe ser mayor a cero (RN-02)');
        }
        
        // Validar depreciación no mayor a valor contable (RN-06)
        if (depreciacion_acumulada && valor_contable && depreciacion_acumulada > valor_contable) {
            throw new Error('La depreciación acumulada no puede superar el valor contable (RN-06)');
        }
        
        const [result] = await db.query(`
            UPDATE bienes 
            SET nombre = COALESCE(?, nombre),
                serie = COALESCE(?, serie),
                modelo = COALESCE(?, modelo),
                marca = COALESCE(?, marca),
                ubicacion = COALESCE(?, ubicacion),
                valor_contable = COALESCE(?, valor_contable),
                depreciacion_acumulada = COALESCE(?, depreciacion_acumulada),
                custodio_id = COALESCE(?, custodio_id)
            WHERE id = ? AND activo = TRUE
        `, [nombre, serie, modelo, marca, ubicacion, valor_contable, 
            depreciacion_acumulada, custodio_id, id]);
        
        return result.affectedRows > 0;
    },
    
    // RF-05: Eliminar bien (soft delete según RN-04)
    softDelete: async (id) => {
        const [result] = await db.query(`
            UPDATE bienes SET activo = FALSE WHERE id = ? AND activo = TRUE
        `, [id]);
        
        return result.affectedRows > 0;
    },
    
    // Obtener bien por ID
    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT * FROM bienes WHERE id = ? AND activo = TRUE
        `, [id]);
        
        if (rows.length === 0) return null;
        
        return {
            ...rows[0],
            estado: calcularEstado(rows[0].valor_contable, rows[0].depreciacion_acumulada)
        };
    },
    
    // Obtener estadísticas para reportes
    getEstadisticas: async () => {
        const [total] = await db.query('SELECT COUNT(*) as total FROM bienes WHERE activo = TRUE');
        const [valorTotal] = await db.query('SELECT SUM(valor_contable) as total FROM bienes WHERE activo = TRUE');
        const [depreciacionTotal] = await db.query('SELECT SUM(depreciacion_acumulada) as total FROM bienes WHERE activo = TRUE');
        
        const bienes = await Bien.findAll();
        const estados = {
            BUENO: bienes.filter(b => b.estado === 'BUENO').length,
            REGULAR: bienes.filter(b => b.estado === 'REGULAR').length,
            CRÍTICO: bienes.filter(b => b.estado === 'CRÍTICO').length
        };
        
        return {
            total_bienes: total[0].total,
            valor_total: valorTotal[0].total || 0,
            depreciacion_total: depreciacionTotal[0].total || 0,
            valor_neto: (valorTotal[0].total || 0) - (depreciacionTotal[0].total || 0),
            por_estado: estados
        };
    }
};

module.exports = Bien;