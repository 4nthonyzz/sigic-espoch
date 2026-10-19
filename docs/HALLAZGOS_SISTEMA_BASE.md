# Anexo Técnico: Hallazgos y Auditoría del Sistema Base SIGIC-ESPOCH

**Proyecto:** Prácticas Comunitarias — Módulo de Pre-matrícula y Control de Estudiantes (Academia CISCO)  
**Institución:** Escuela Superior Politécnica de Chimborazo (ESPOCH) — Facultad de Informática y Electrónica (FIE)  
**Fecha de Auditoría:** Octubre 2026  
**Equipo Auditor / Desarrolladores:** Anthony Abad, Martin Ronquillo  
**Docente / Tutor:** Ing. Marco Vinicio Ramos Valencia  

---

## 1. Justificación y Propósito del Documento

Durante la fase de análisis técnico e inducción previa al desarrollo del nuevo **Módulo de Pre-matrícula y Matrícula**, se realizó una auditoría profunda sobre el código fuente existente del sistema **SIGIC-ESPOCH** (backend Express, frontend SPA y scripts de base de datos MySQL).

Con el objetivo de **proteger la integridad del sistema en producción** y optimizar el tiempo de desarrollo (10 semanas efectivas de trabajo), se determinó la directiva técnica de **aislar el nuevo módulo** y **no modificar el código defectuoso del sistema base**, documentando aquí todos los hallazgos encontrados para que sirvan de constancia formal en el informe final de prácticas comunitarias.

---

## 2. Registro de Inconsistencias y Defectos Técnicos Identificados

### Hallazgo 1: Desalineación entre `schema.sql` y el Modelo `Bien.js`
* **Ubicación:** `database/schema.sql` frente a `backend/models/Bien.js` y `database/migracion_completa_v2.sql`.
* **Detalle Técnico:** El script inicial `schema.sql` define una tabla `bienes` con 14 columnas. Sin embargo, el script de datos reales `migracion_completa_v2.sql` y las consultas SQL del modelo `Bien.js` intentan insertar y consultar 18 columnas (`codigo_anterior`, `bodega`, `tipo_registro`, `fecha_asignacion`, `numero_acta`, `cantidad`, `estado_manual`).
* **Impacto:** Si se despliega el sistema desde un contenedor nuevo usando solo `schema.sql`, cualquier inserción o consulta arroja un error crítico de base de datos: `ERROR 1054 (42S22): Unknown column 'codigo_anterior' in 'field list'`.

### Hallazgo 2: Inconsistencia entre Especificación y Código en la Baja de Bienes
* **Ubicación:** `backend/models/Bien.js` (Método `delete`).
* **Detalle Técnico:** El Manual de Sistema y las Reglas de Negocio institucionales (RN-04) establecen que la baja de un bien debe ser **lógica** (`activo = FALSE`) para preservar la trazabilidad patrimonial. No obstante, el código ejecuta una eliminación física irreversible: `DELETE FROM bienes WHERE id = ?`.
* **Impacto:** Pérdida permanente de registros históricos de inventario en la base de datos al eliminar un equipo.

### Hallazgo 3: Conflicto de Enrutamiento Dinámico en Express (`/api/bienes/estadisticas`)
* **Ubicación:** `backend/routes/bienes.js` (Líneas 10 a 13).
* **Detalle Técnico:** La ruta parametrizada `router.get('/:id', ...)` fue registrada **antes** que la ruta fija `router.get('/estadisticas', ...)`.
* **Impacto:** En Express, las rutas se resuelven en orden de declaración. Cuando el frontend solicita el reporte de estadísticas, el servidor captura la cadena `'estadisticas'` como el parámetro `:id`. Al ejecutar `parseInt('estadisticas', 10)`, el valor resultante es `NaN`, produciendo una consulta fallida en MySQL (`WHERE id = NaN`) y retornando un error HTTP 500 con el mensaje `Unknown column 'NaN' in 'where clause'`.

### Hallazgo 4: Script de Migración Destructivo
* **Ubicación:** `database/migracion_completa_v2.sql` (Línea 8).
* **Detalle Técnico:** El script inicia con la instrucción incondicional `DELETE FROM bienes;` sin validar si existen datos previos o respaldos.
* **Impacto:** Cualquier ejecución inadvertida del script en un entorno productivo vacía por completo el inventario registrado.

### Hallazgo 5: Código Frontend Duplicado y Scripts no Vinculados
* **Ubicación:** `frontend/js/` frente a `frontend/dashboard.html`.
* **Detalle Técnico:** Aunque existen archivos JavaScript modulares en la carpeta `frontend/js/` (`app.js`, `inventory.js`, `dashboard.js`, etc.), el archivo `dashboard.html` no los importa externamente, sino que contiene miles de líneas de JavaScript embebidas directamente en etiquetas `<script>`.
* **Impacto:** Modificar los archivos de la carpeta `frontend/js/` no produce ningún efecto en la interfaz visual, generando confusión y retrabajo si no se inspecciona el archivo HTML monolítico.

### Hallazgo 6: Vulnerabilidad de Autenticación en Cliente (`localStorage`)
* **Ubicación:** `frontend/index.html` y `frontend/js/auth.js`.
* **Detalle Técnico:** El inicio de sesión no consulta a un endpoint seguro en el backend (`/api/auth/login`). Las credenciales de usuarios administradores y contraseñas se almacenan en texto plano en el `localStorage` del navegador web.
* **Impacto:** Cualquier usuario con acceso a la consola del navegador puede leer contraseñas o adulterar privilegios sin validación criptográfica en el servidor.

### Hallazgo 7: Modelo Incompleto de Custodios
* **Ubicación:** `backend/models/Custodio.js`.
* **Detalle Técnico:** El archivo existe en la estructura de archivos pero su tamaño es de 0 bytes (completamente vacío).
* **Impacto:** No existe lógica modular ni capa de acceso a datos para la gestión independiente de custodios, dependiendo únicamente de consultas directas con `LEFT JOIN` desde `Bien.js`.

### Hallazgo 8: Contradicciones y Credenciales en Texto Plano en Manuales
* **Ubicación:** `Manuales/Manual_Instalacion_SIGIC_ESPOCH.docx` y `docker-compose.yml`.
* **Detalle Técnico:** Un manual hace referencia a un contenedor llamado `sigic-database` operado por el usuario `root`, mientras que el archivo de orquestación `docker-compose.yml` utiliza `sigic-mysql` con el usuario `sigic_user`. Asimismo, contraseñas de producción se encuentran expuestas en texto legible dentro de la documentación.

---

## 3. Decisión de Arquitectura y Mitigación para el Nuevo Módulo

Ante este diagnóstico, el equipo de desarrollo adopta las siguientes **medidas de aislamiento y calidad**:

1. **Persistencia Independiente:** Todo el modelo de datos de pre-matrículas, ofertas de paralelos, pagos y asistencias se confina en el script nuevo `database/03_prematricula.sql`, sin tocar `schema.sql` ni la migración de bienes.
2. **Seguridad Robusta:** El nuevo módulo no utilizará `localStorage` para autenticación. Se implementa autenticación real mediante tokens **JWT** (JSON Web Tokens) y contraseñas cifradas con **bcrypt**, resguardando la clave secreta `JWT_SECRET` en variables de entorno `.env`.
3. **Validación de Tarifas en Servidor:** La tarifa preferencial para estudiantes politécnicos se evalúa estrictamente en el backend mediante el dominio `@espoch.edu.ec`, impidiendo manipulaciones desde el cliente.
4. **Interfaces Autónomas:** El acceso de estudiantes se canaliza a través de páginas independientes (`prematricula.html`), evitando alterar el código embebido de `dashboard.html`.

---
*Fin del Anexo de Hallazgos Técnicos.*
