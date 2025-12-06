const fs = require('fs').promises;
const path = require('path');
const db = require('../db');
const bcrypt = require('bcrypt');

// funcion para cargar JSON a la base de datos
async function cargarDatosIniciales() {
    try {
        console.log('Verificando estado de la base de datos...');

        let concesTotal = 0, usersTotal = 0, vehiTotal = 0;

        // Verificar si las tablas existen y cuántos registros tienen
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

        // Solo cargar si alguna tabla está vacía (o todas)
        /*if (concesTotal > 0 && usersTotal > 0 && vehiTotal > 0) {
            console.log('Base de datos ya tiene datos. Saltando carga inicial.');
            return { exito: true, mensaje: 'Datos ya existentes', yaCargado: true };
        }*/

        console.log('Cargando datos iniciales desde JSON...');

        const concesionariosPath = path.join(__dirname, './concesionarios.json');
        const usuariosPath = path.join(__dirname, './usuarios.json');
        const vehiculosPath = path.join(__dirname, './vehiculos.json');

        const concesionarios = JSON.parse(await fs.readFile(concesionariosPath, 'utf8'));
        const usuarios = JSON.parse(await fs.readFile(usuariosPath, 'utf8'));
        const vehiculos = JSON.parse(await fs.readFile(vehiculosPath, 'utf8'));

        console.log(`JSON cargados → ${concesionarios.length}C | ${usuarios.length}U | ${vehiculos.length}V`);

        // Limpiar tablas (por si hay datos parciales)
        console.log('Limpiando tablas existentes...');
        await db.query("SET FOREIGN_KEY_CHECKS = 0");
        await db.query("TRUNCATE TABLE reservas");        // si existe
        await db.query("TRUNCATE TABLE vehiculos");
        await db.query("TRUNCATE TABLE usuarios");
        await db.query("TRUNCATE TABLE concesionarios");
        await db.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log('Tablas limpiadas y reiniciadas');

        let consCreados = 0, usersCreados = 0, vehiCreados = 0;

        // 1. Cargar Concesionarios
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

        // 2. Cargar Usuarios (necesitan id_concesionario → ya existen los concesionarios)
        console.log('Cargando usuarios...');
        for (const u of usuarios) {
            const rawPass = (u.contrasena && String(u.contrasena)) || null;

            const hashed = await bcrypt.hash(rawPass, 10);
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
                    v.estado,
                    v.id_concesionario
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