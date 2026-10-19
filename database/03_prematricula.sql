-- =====================================================================
-- SIGIC-ESPOCH - MÓDULO DE PRE-MATRÍCULA, MATRÍCULA Y CONTROL DE ASISTENCIA
-- Archivo: 03_prematricula.sql
-- Propósito: Esquema de base de datos aislado para la Academia CISCO
-- =====================================================================

USE sigic_espoch;

-- 1. Tabla de Usuarios (Autenticación real con JWT/bcrypt para el módulo)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(150) NOT NULL,
    cedula VARCHAR(20) NULL,
    rol ENUM('estudiante', 'admin') NOT NULL DEFAULT 'estudiante',
    tarifa ENUM('institucional', 'general') NOT NULL DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabla de Ofertas de Curso (Paralelos, tarifas y cupos por curso Cisco)
CREATE TABLE IF NOT EXISTS ofertas_curso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    paralelo VARCHAR(10) NOT NULL,
    costo_general DECIMAL(10,2) NOT NULL,
    costo_reducido DECIMAL(10,2) NOT NULL,
    pago_minimo DECIMAL(10,2) NOT NULL,
    cupo_minimo INT NOT NULL DEFAULT 15,
    cupo_maximo INT NOT NULL DEFAULT 20,
    fecha_limite DATE NULL,
    estado ENUM('abierta', 'confirmada', 'cerrada', 'cancelada') DEFAULT 'abierta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    UNIQUE KEY uq_curso_paralelo (curso_id, paralelo),
    CHECK (cupo_minimo <= cupo_maximo),
    CHECK (pago_minimo > 0),
    CHECK (costo_reducido <= costo_general)
);

-- 3. Tabla de Pre-matrículas (Reserva de cupo y matrícula formal)
CREATE TABLE IF NOT EXISTS prematriculas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    oferta_id INT NOT NULL,
    tarifa_aplicada ENUM('institucional', 'general') NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    estado ENUM('reservada', 'matriculada', 'anulada') DEFAULT 'reservada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (oferta_id) REFERENCES ofertas_curso(id) ON DELETE CASCADE,
    UNIQUE KEY uq_usuario_oferta (usuario_id, oferta_id)
);

-- 4. Tabla de Pagos (Reserva de cupo y saldo restante)
CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prematricula_id INT NOT NULL,
    tipo ENUM('reserva', 'saldo') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    comprobante VARCHAR(100) NULL,
    estado ENUM('pendiente', 'verificado', 'rechazado') DEFAULT 'pendiente',
    observacion VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prematricula_id) REFERENCES prematriculas(id) ON DELETE CASCADE
);

-- 5. Tabla de Asistencias (Seguimiento diario por clase para certificación)
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prematricula_id INT NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prematricula_id) REFERENCES prematriculas(id) ON DELETE CASCADE,
    UNIQUE KEY uq_prematricula_fecha (prematricula_id, fecha)
);
