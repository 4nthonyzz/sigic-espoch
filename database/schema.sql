-- SIGIC-ESPOCH Database Schema
CREATE DATABASE IF NOT EXISTS sigic_espoch;
USE sigic_espoch;

-- Tabla: custodios
CREATE TABLE IF NOT EXISTS custodios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: bienes
CREATE TABLE IF NOT EXISTS bienes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    serie VARCHAR(50),
    modelo VARCHAR(50),
    marca VARCHAR(50),
    ubicacion VARCHAR(100),
    valor_contable DECIMAL(10,2) NOT NULL,
    depreciacion_acumulada DECIMAL(10,2) DEFAULT 0,
    custodio_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_ingreso DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (custodio_id) REFERENCES custodios(id) ON DELETE SET NULL
);

-- Tabla: cursos
CREATE TABLE IF NOT EXISTS cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    participantes INT DEFAULT 0,
    instructor VARCHAR(100),
    horario VARCHAR(100),
    estado ENUM('activo', 'finalizado', 'cancelado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos de prueba
INSERT INTO custodios (cedula, nombre_completo, cargo) VALUES
('1712345678', 'Ana María López García', 'Coordinadora de Laboratorios'),
('1723456789', 'Carlos Eduardo Ramírez Paz', 'Jefe de Bodega'),
('1734567890', 'María Fernanda Torres Silva', 'Administradora de Bienes');

INSERT INTO bienes (codigo, nombre, serie, modelo, marca, ubicacion, valor_contable, depreciacion_acumulada, custodio_id, fecha_ingreso) VALUES
('RTR-001', 'Router Cisco 4331', 'FGL22102ABC', '4331', 'Cisco', 'RACK-A1', 2500.00, 500.00, 1, '2023-01-15'),
('SW-002', 'Switch Cisco 2960', 'FD02149Z0A1', '2960', 'Cisco', 'RACK-B2', 1200.00, 300.00, 1, '2023-06-10'),
('ACC-003', 'Console Cable Bundle', 'KIT-CC-09', 'CAB-CONSOLE', 'Cisco', 'LAB-A', 45.00, 5.00, 2, '2024-01-20'),
('RTR-004', 'Router Cisco 2901', 'FGL19123XYZ', '2901', 'Cisco', 'RACK-A1', 1800.00, 1600.00, 1, '2020-11-20'),
('SW-005', 'Switch Cisco 3750', 'FD02873B2C', '3750', 'Cisco', 'RACK-B2', 950.00, 920.00, 3, '2019-03-05');

INSERT INTO cursos (nombre, participantes, instructor, horario, estado) VALUES
('CCNAv7: Introducción a Redes', 25, 'Ing. Vinicio Ramos', 'Lun/Mie 14:00-16:00', 'activo'),
('CCNA Security', 18, 'Ing. Carlos Álvaro', 'Mar/Jue 10:00-12:00', 'activo'),
('Cisco CyberOps Associate', 12, 'Ing. Bryan Caguana', 'Vie 08:00-12:00', 'activo'),
('CCNP Enterprise', 30, 'Ing. Marco López', 'Lun/Mie 16:00-18:00', 'finalizado'),
('Fundamentos de IoT', 8, 'Ing. Ana Torres', 'Mar 14:00-16:00', 'cancelado');