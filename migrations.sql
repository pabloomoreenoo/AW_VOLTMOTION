/* esquema SQL para crear las tablas necesarias */
-- migrations.sql (crea BD y tablas básicas)
CREATE DATABASE IF NOT EXISTS lab5_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lab5_db;

CREATE TABLE IF NOT EXISTS concesionarios (
  id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  ciudad VARCHAR(100),
  direccion VARCHAR(255),
  telefono VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  correo VARCHAR(200) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('empleado','admin') NOT NULL DEFAULT 'empleado',
  telefono VARCHAR(25),
  id_concesionario INT,
  preferencias_accesibilidad JSON,
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario)
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(25) NOT NULL UNIQUE,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  ano_matriculacion INT,
  numero_plazas INT,
  autonomia_km INT,
  color VARCHAR(50),
  imagen VARCHAR(255),
  estado ENUM('disponible','reservado','mantenimiento') DEFAULT 'disponible',
  id_concesionario INT,
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario)
);

CREATE TABLE IF NOT EXISTS reservas (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_vehiculo INT NOT NULL,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  estado ENUM('activa','finalizada','cancelada') DEFAULT 'activa',
  kilometros_recorridos INT DEFAULT 0,
  incidencias_reportadas TEXT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo)
);


INSERT INTO usuarios (
    nombre,
    correo,
    contrasena,
    rol,
    telefono,
    id_concesionario,
    preferencias_accesibilidad
) VALUES 
-- 1. Administrador principal
('Ana Martínez Gómez', 
 'ana.martinez@ucm.es', 
 '$2y$10$J9x5vZk1f9j5z8K9pQ2X9u8v7b6n5m4k3j2h1g0f9e8d7c6b5a4Z3', -- contraseña: Admin2025!
 'admin',
 '600112233',
 1,
 '{"tema":"oscuro","tamano_fuente":"grande","alto_contraste":true}'),

-- 2. Empleado ventas Madrid
('Carlos Ruiz Pérez', 
 'carlos.ruiz@ucm.es', 
 '$2y$10$8F4d3s2a1Z9x8c7v6b5n4m3lk2j1h0g9f8e7d6c5b4a3Z2Y1X9W8V', -- contraseña: Ventas2025
 'empleado',
 '612345678',
 1,
 NULL),

-- 3. Empleado taller Barcelona
('Laura Fernández Díaz', 
 'laura.fernandez@ucm.es', 
 '$2y$10$k5l4j3h2g1f0e9d8c7b6n5m4lk3j2h1g0f9e8d7c6b5a4Z3Y2X1W9V', -- contraseña: Taller123
 'empleado',
 '645987321',
 2,
 '{"tema":"claro","tamano_fuente":"normal","lectura_voz":true}'),

-- 4. Administrador secundario
('Marcos Sánchez López', 
 'marcos.sanchez@ucm.es', 
 '$2y$10$T6y5u4i3o2p1a0s9d8f7g6h5j4k3l2z1x0c9v8b7n6m5l4k3j2h1Y', -- contraseña: AdminSec2025
 'admin',
 '699887766',
 3,
 NULL),

-- 5. Empleado atención al cliente Valencia
('Sofía Herrera Vega', 
 'sofia.herrera@concesionario.com', 
 '$2y$10$R9e8d7c6b5a4Z3Y2X1W0V9U8I7Y6T5R4E3W2Q1P0O9I8U7Y6T5R4E', -- contraseña: Cliente2025*
 'empleado',
 '611223344',
 2,
 '{"tema":"oscuro","tamano_fuente":"grande"}');

INSERT INTO concesionarios (nombre, ciudad, direccion, telefono) VALUES
('Electro Movilidad Central', 'Madrid', 'Paseo de la Castellana, 100', '910 555 123'),
('Concesionario Futuro E-Car', 'Barcelona', 'Avenida Diagonal, 250', '930 555 456'),
('Ecomotor Valencia', 'Valencia', 'Gran Vía, 5', '960 555 789'),
('Norte Eléctrico Automoción', 'Bilbao', 'Calle Euskalduna, 15', '940 555 101'),
('Sur EV Point', 'Sevilla', 'Avenida de la Constitución, 30', '950 555 202');
('VientoRomareda', 'Zaragoza', 'Calle del Pilar, 21', '920 655 183');

INSERT INTO vehiculos (matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES
-- Vehículos asignados al Concesionario 1 (ID: 1)
('1234ABC', 'Tesla', 'Model 3 Long Range', 2023, 5, 600, 'Blanco Perla', NULL, 'disponible', 1),
('5678CDE', 'Nissan', 'Leaf E+', 2022, 5, 385, 'Gris Metálico', NULL, 'disponible', 1),
('9012FGH', 'Renault', 'Zoe R135', 2023, 5, 395, 'Azul Eléctrico', NULL, 'disponible', 1),
('3456IJK', 'Hyundai', 'Kona Eléctrico', 2024, 5, 484, 'Rojo Pasión', NULL, 'reservado', 1),
('7890LMN', 'Kia', 'EV6 Air', 2023, 5, 528, 'Negro Ébano', NULL, 'disponible', 1),
('1122OPQ', 'Tesla', 'Model S Plaid', 2024, 5, 637, 'Negro Sólido', NULL, 'disponible', 1),
('1122OP8', 'Conchita', 'Moreno', 2024, 5, 637, 'Negro Sólido', '/img/vehiculos/prueba1.jpg', 'disponible', 1),

-- Vehículos asignados al Concesionario 2 (ID: 2)
('3344RST', 'Ford', 'Mustang Mach-E', 2024, 5, 610, 'Azul Medianoche', NULL, 'disponible', 2),
('5566UVW', 'Chevrolet', 'Bolt EUV', 2023, 5, 402, 'Naranja Fusión', NULL, 'disponible', 2),
('7788XYZ', 'BMW', 'i4 eDrive40', 2024, 5, 590, 'Verde Bosque', NULL, 'mantenimiento', 2),
('9900AAB', 'Audi', 'e-tron Sportback 55', 2022, 5, 453, 'Blanco Glaciar', NULL, 'disponible', 2),
('2211BBC', 'Mercedes-Benz', 'EQA 250', 2023, 5, 493, 'Gris Selenita', NULL, 'reservado', 2),
('4433CCD', 'Polestar', '2 Long Range', 2023, 5, 540, 'Void Negro', NULL, 'disponible', 2),

-- Vehículos asignados al Concesionario 3 (ID: 3)
('6655DDE', 'Porsche', 'Taycan 4S', 2024, 4, 463, 'Rojo Carmín', NULL, 'disponible', 3),
('8877EEF', 'Volvo', 'C40 Recharge', 2022, 5, 444, 'Azul Nórdico', NULL, 'disponible', 3),
('0099FFG', 'Fiat', '500e La Prima', 2024, 4, 320, 'Verde Menta', NULL, 'disponible', 3),
('1020GGH', 'Peugeot', 'e-208 GT', 2023, 5, 362, 'Amarillo Faro', NULL, 'reservado', 3),
('3040HHI', 'Opel', 'Corsa-e', 2022, 5, 359, 'Blanco Polar', NULL, 'mantenimiento', 3),
('5060IIJ', 'Lucid', 'Air Grand Touring', 2023, 5, 830, 'Plata Zenith', NULL, 'disponible', 3),

-- Vehículos asignados al Concesionario 4 (ID: 4)
('7080JJK', 'Citroën', 'ë-C4 X', 2023, 5, 360, 'Gris Platino', NULL, 'disponible', 4),
('9010KKL', 'Volkswagen', 'ID.4 Pro', 2022, 5, 520, 'Plata Puro', NULL, 'disponible', 4),
('1357LLM', 'Nio', 'ET5', 2023, 5, 560, 'Azul Nube', NULL, 'reservado', 4),
('2468MMN', 'Xpeng', 'P7', 2022, 5, 500, 'Blanco Polar', NULL, 'disponible', 4),
('8642NNO', 'Skoda', 'Enyaq iV 80', 2024, 5, 537, 'Rojo Velvet', NULL, 'disponible', 4),
('9753OOP', 'Genesis', 'GV60 Sport Plus', 2024, 5, 517, 'Azul Riviera', NULL, 'disponible', 4),

-- Vehículos asignados al Concesionario 5 (ID: 5)
('1470PPQ', 'Cupra', 'Born VZ', 2023, 5, 420, 'Gris Granito', NULL, 'disponible', 5),
('2581QQ R', 'Subaru', 'Solterra Touring', 2022, 5, 465, 'Verde Musgo', NULL, 'mantenimiento', 5),
('3692RRS', 'Toyota', 'bZ4X', 2023, 5, 500, 'Negro Mica', NULL, 'disponible', 5),
('4703SST', 'Jeep', 'Avenger Eléctrico', 2024, 5, 400, 'Amarillo Sol', NULL, 'disponible', 5),
('5814TTU', 'Lexus', 'RZ 450e', 2023, 5, 440, 'Plata Sónico', NULL, 'reservado', 5),
('6925UUV', 'Maserati', 'GranTurismo Folgore', 2024, 4, 450, 'Azul Nobile', NULL, 'disponible', 5);