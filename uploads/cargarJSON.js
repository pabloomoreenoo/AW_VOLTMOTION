const fs = require('fs').promises;
const path = require('path');
const db = require('../db');
const bcrypt = require('bcrypt');

// funcion para cargar JSON a la base de datos
async function crearTablasSiNoExisten() {
    
    const ddls = [
`CREATE TABLE IF NOT EXISTS concesionarios (
  id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  ciudad VARCHAR(100),
  direccion VARCHAR(255),
  telefono VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

`CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  correo VARCHAR(200) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('empleado','admin') NOT NULL DEFAULT 'empleado',
  telefono VARCHAR(25),
  id_concesionario INT,
  preferencias_accesibilidad JSON,
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

`CREATE TABLE IF NOT EXISTS vehiculos (
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
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

`CREATE TABLE IF NOT EXISTS reservas (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_vehiculo INT NOT NULL,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  estado ENUM('activa','finalizada','cancelado') DEFAULT 'activa',
  kilometros_recorridos INT DEFAULT 0,
  incidencias_reportadas TEXT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    ];

    for (const ddl of ddls) {
        await db.query(ddl);
    }
}

async function cargarDatosIniciales() {
    try {
        console.log('Verificando estado de la base de datos...');

        
        await crearTablasSiNoExisten();

        let concesTotal = 0, usersTotal = 0, vehiTotal = 0;

        try {
            const [rows] = await db.query("SELECT COUNT(*) as total FROM concesionarios");
            concesTotal = rows[0].total;
        } catch (e) { console.log('Tabla concesionarios no existe o vacía'); }

        try {
            const [rows] = await db.query("SELECT COUNT(*) as total FROM usuarios");
            usersTotal = rows[0].total;
        } catch (e) { console.log('Tabla usuarios no existe o vacía'); }

        try {
            const [rows] = await db.query("SELECT COUNT(*) as total FROM vehiculos");
            vehiTotal = rows[0].total;
        } catch (e) { console.log('Tabla vehiculos no existe o vacía'); }

        console.log(`Estado actual BD → ${concesTotal} concesionarios | ${usersTotal} usuarios | ${vehiTotal} vehículos`);

        console.log('Cargando datos iniciales desde JSON...');

        const concesionariosPath = path.join(__dirname, './concesionarios.json');
        const usuariosPath = path.join(__dirname, './usuarios.json');
        const vehiculosPath = path.join(__dirname, './vehiculos.json');

        const concesionarios = JSON.parse(await fs.readFile(concesionariosPath, 'utf8'));
        const usuarios = JSON.parse(await fs.readFile(usuariosPath, 'utf8'));
        const vehiculos = JSON.parse(await fs.readFile(vehiculosPath, 'utf8'));

        console.log(`JSON cargados → ${concesionarios.length}C | ${usuarios.length}U | ${vehiculos.length}V`);

        
        console.log('Limpiando tablas existentes...');
        await db.query("SET FOREIGN_KEY_CHECKS = 0");
        
        await db.query("TRUNCATE TABLE reservas");
        await db.query("TRUNCATE TABLE vehiculos");
        await db.query("TRUNCATE TABLE usuarios");
        await db.query("TRUNCATE TABLE concesionarios");
        await db.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log('Tablas limpiadas y reiniciadas');

        let consCreados = 0, usersCreados = 0, vehiCreados = 0;

        
        console.log('Cargando concesionarios...');
        for (const c of concesionarios) {
            await db.query(
                `INSERT INTO concesionarios (nombre, ciudad, direccion, telefono) 
                 VALUES (?, ?, ?, ?)`,
                [c.nombre, c.ciudad, c.direccion, c.telefono]
            );
            consCreados++;
            console.log(`  Concesionario: ${c.nombre} (${c.ciudad})`);
        }

        
        console.log('Cargando usuarios...');
        for (const u of usuarios) {
            const rawPass = (u.contrasena && String(u.contrasena)) || null;

            
            let hashed;
            if (!rawPass) {
                hashed = null;
            } else if (/^\$2[aby]\$/.test(rawPass)) {
                // parece un bcrypt hash ya
                hashed = rawPass;
            } else {
                hashed = await bcrypt.hash(rawPass, 10);
            }

            await db.query(
                `INSERT INTO usuarios 
                 (nombre, correo, contrasena, rol, telefono, id_concesionario, preferencias_accesibilidad) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    u.nombre,
                    u.correo,
                    hashed,
                    u.rol,
                    u.telefono || null,
                    u.id_concesionario || null,
                    u.preferencias_accesibilidad ? JSON.stringify(u.preferencias_accesibilidad) : null
                ]
            );
            usersCreados++;
            console.log(`  Usuario: ${u.correo} (${u.rol})`);
        }

        // 3. Cargar Vehículos
        console.log('Cargando vehículos...');
        for (const v of vehiculos) {
            await db.query(
                `INSERT INTO vehiculos 
                 (matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, 
                  color, imagen, estado, id_concesionario) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    v.matricula,
                    v.marca,
                    v.modelo,
                    v.ano_matriculacion,
                    v.numero_plazas,
                    v.autonomia_km,
                    v.color,
                    v.imagen || null,
                    v.estado || 'disponible',
                    v.id_concesionario || null
                ]
            );
            vehiCreados++;
            console.log(`  Vehículo: ${v.matricula} → ${v.marca} ${v.modelo}`);
        }

        // Resumen final
        console.log('\nRESUMEN DE CARGA COMPLETA');
        console.log(`   Concesionarios: ${consCreados}`);
        console.log(`   Usuarios: ${usersCreados}`);
        console.log(`   Vehículos: ${vehiCreados}`);

        // Devolver credenciales del admin principal
        const [[admin]] = await db.query(
            "SELECT correo FROM usuarios WHERE rol = 'admin' LIMIT 1"
        );

        return {
            exito: true,
            mensaje: '¡Datos iniciales cargados correctamente!',
            total: { concesionarios: consCreados, usuarios: usersCreados, vehiculos: vehiCreados },
            admin: admin ? admin.correo : 'No encontrado'
        };

    } catch (error) {
        console.error('ERROR al cargar datos iniciales:', error.message);
        return {
            exito: false,
            mensaje: 'Error en carga inicial: ' + error.message
        };
    }
}

module.exports = {cargarDatosIniciales};
