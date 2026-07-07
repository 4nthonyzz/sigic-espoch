const db = require('../config/database');

// Función para calcular estado según RN-05 y RF-03 (Protegida contra división por cero)
const calcularEstado = (valorContable, depreciacionAcumulada) => {
    const vContable = parseFloat(valorContable) || 0;
    
    // Si el equipo no tiene valor financiero registrado, asumimos estado BUENO temporalmente
    if (vContable <= 0) return 'BUENO';
    
    const porcentaje = (depreciacionAcumulada / vContable) * 100;
    
    if (porcentaje < 80) return 'BUENO';
    if (porcentaje >= 80 && porcentaje <= 95) return 'REGULAR';
    return 'CRÍTICO';
};

const Bien = {
    // RF-01: Visualización de inventario completo (solo activos) - CON TODOS LOS CAMPOS
    findAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                b.id,
                b.codigo,
                b.codigo_anterior,
                b.nombre,
                b.serie,
                b.modelo,
                b.marca,
                b.bodega,
                b.ubicacion,
                b.tipo_registro,
                b.fecha_ingreso,
                b.fecha_asignacion,
                b.numero_acta,
                b.cantidad,
                b.valor_contable,
                b.depreciacion_acumulada,
                b.estado_manual,
                b.activo,
                b.created_at,
                b.updated_at,
                c.nombre_completo as custodio_nombre,
                c.cedula as custodio_cedula,
                IF(b.valor_contable > 0, ROUND((b.depreciacion_acumulada / b.valor_contable) * 100, 2), 0.00) as porcentaje_depreciacion
            FROM bienes b
            LEFT JOIN custodios c ON b.custodio_id = c.id
            WHERE b.activo = TRUE
            ORDER BY b.codigo ASC
        `);
        
        // Añadir estado calculado a cada bien controlando valores en cero
        return rows.map(bien => {
            const vContable = parseFloat(bien.valor_contable) || 0;
            const dAcumulada = parseFloat(bien.depreciacion_acumulada) || 0;
            const porcDepreciacion = vContable > 0 ? ((dAcumulada / vContable) * 100) : 0;

            return {
                ...bien,
                estado: calcularEstado(vContable, dAcumulada),
                porcentaje_depreciacion: porcDepreciacion.toFixed(2)
            };
        });
    },
    
    // RF-02: Agregar nuevo bien con validación RN-01 y RN-02 - CON TODOS LOS CAMPOS
    create: async (bienData) => {
        const { 
            codigo, codigo_anterior, nombre, serie, modelo, marca, 
            bodega, ubicacion, tipo_registro, fecha_ingreso, 
            fecha_asignacion, numero_acta, cantidad, 
            valor_contable, depreciacion_acumulada, estado_manual,
            custodio_id 
        } = bienData;
        
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
            INSERT INTO bienes (
                codigo, codigo_anterior, nombre, serie, modelo, marca, 
                bodega, ubicacion, tipo_registro, fecha_ingreso, 
                fecha_asignacion, numero_acta, cantidad, 
                valor_contable, depreciacion_acumulada, estado_manual, 
                custodio_id, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            codigo, codigo_anterior || null, nombre, serie || null, modelo || null, marca || null,
            bodega || null, ubicacion || null, tipo_registro || null, fecha_ingreso || null,
            fecha_asignacion || null, numero_acta || null, cantidad || 1,
            valor_contable, depreciacion_acumulada || 0, estado_manual || null,
            custodio_id || null, 1
        ]);
        
        return { id: result.insertId, ...bienData };
    },
    
    // RF-03: Cálculo automático de estado (método público)
    calcularEstado,
    
    // RF-04: Editar bien existente - CON TODOS LOS CAMPOS
    update: async (id, bienData) => {
        const { 
            codigo, valor_contable, depreciacion_acumulada 
        } = bienData;
        
        // Si necesitamos validar valor contable o depreciación acumulada
        if (valor_contable !== undefined || depreciacion_acumulada !== undefined) {
            const [current] = await db.query('SELECT valor_contable, depreciacion_acumulada FROM bienes WHERE id = ? AND activo = TRUE', [id]);
            if (current.length > 0) {
                const finalValor = valor_contable !== undefined ? valor_contable : parseFloat(current[0].valor_contable);
                const finalDepreciacion = depreciacion_acumulada !== undefined ? depreciacion_acumulada : parseFloat(current[0].depreciacion_acumulada);
                
                if (finalValor <= 0) {
                    throw new Error('El valor contable debe ser mayor a cero (RN-02)');
                }
                if (finalDepreciacion > finalValor) {
                    throw new Error('La depreciación acumulada no puede superar el valor contable (RN-06)');
                }
            }
        }
        
        // Verificar unicidad de código si se está cambiando
        if (codigo) {
            const [existing] = await db.query('SELECT id FROM bienes WHERE codigo = ? AND id != ?', [codigo, id]);
            if (existing.length > 0) {
                throw new Error('El código del bien ya existe (RN-01)');
            }
        }
        
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(bienData)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (fields.length === 0) {
            const [existing] = await db.query('SELECT id FROM bienes WHERE id = ? AND activo = TRUE', [id]);
            return existing.length > 0;
        }

        values.push(id);
        const [result] = await db.query(
            `UPDATE bienes SET ${fields.join(', ')} WHERE id = ? AND activo = TRUE`,
            values
        );
        
        return result.affectedRows > 0;
    },
    
    // RF-05: hard delete
    delete: async (id) => {
        const [result] = await db.query(`
            DELETE FROM bienes WHERE id = ?
        `, [id]);
        
        console.log('Delete result:', { affectedRows: result.affectedRows, changedRows: result.changedRows });
        return result.affectedRows > 0;
    },
    
    // Obtener bien por ID - CON TODOS LOS CAMPOS
    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                b.*,
                c.nombre_completo as custodio_nombre,
                c.cedula as custodio_cedula,
                IF(b.valor_contable > 0, ROUND((b.depreciacion_acumulada / b.valor_contable) * 100, 2), 0.00) as porcentaje_depreciacion
            FROM bienes b
            LEFT JOIN custodios c ON b.custodio_id = c.id
            WHERE b.id = ? AND b.activo = TRUE
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
