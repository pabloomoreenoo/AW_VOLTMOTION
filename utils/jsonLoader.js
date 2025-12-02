const fs = require('fs').promises;
const pool = require('../db');

async function loadVehiclesAndConcesionarios(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
    // el parseado contine arrays de vehiclos y concesionarios ...
  const report = { addedConces: [], addedVeh: [], updatedVeh: [], conflicts: [] };

  for (const c of parsed.concesionarios || []) {
    // buscar por nombre+ciudad o insertar
    const [rows] = await pool.query(`
        SELECT id_concesionario
        FROM concesionarios 
        WHERE nombre = ? 
        AND ciudad = ?`, 
        [c.nombre, c.ciudad]);
    let id;
    if (rows.length) {
      id = rows[0].id_concesionario;
    } else {
      const [r] = await pool.query(`
        INSERT INTO concesionarios (nombre, ciudad, direccion, telefono) 
        VALUES (?, ?, ?, ?)`, 
        [c.nombre, c.ciudad, c.direccion, c.telefono]);
      id = r.insertId;
      report.addedConces.push({ id, nombre: c.nombre });
    }
  }

  for (const v of parsed.vehiculos || []) {
    // si existe matrícula -> actualizar (según petición) o notificar conflicto
    const [rowsV] = await pool.query(`
        SELECT * FROM vehiculos 
        WHERE matricula = ?`, 
        [v.matricula]);
    if (rowsV.length) {
      // actualizar
      await pool.query(`UPDATE vehiculos 
        SET marca=?, 
        modelo=?, 
        ano_matriculacion=?,
         numero_plazas=?, 
         autonomia_km=?, 
         color=?, imagen=?, 
         estado=?, 
         id_concesionario=? 
         WHERE matricula=?`, 
        [v.marca, v.modelo, v.ano_matriculacion, v.numero_plazas, v.autonomia_km, v.color, v.imagen, v.estado || 'disponible', v.id_concesionario || null, v.matricula]);
      report.updatedVeh.push(v.matricula);
    } else {
      await pool.query(`INSERT INTO vehiculos
         (matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.matricula, v.marca, v.modelo, v.ano_matriculacion, v.numero_plazas, v.autonomia_km, v.color, v.imagen, v.estado || 'disponible', v.id_concesionario || null]);
      report.addedVeh.push(v.matricula);
    }
  }

  return report;
}

module.exports = { loadVehiclesAndConcesionarios };

