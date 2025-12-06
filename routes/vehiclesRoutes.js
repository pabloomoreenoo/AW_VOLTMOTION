const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/concesionarios', async(req, res) => {
    try{
        const [rows] = await pool.query('SELECT id_concesionario, nombre, ciudad, direccion, telefono FROM concesionarios ORDER BY nombre');
        res.json({ ok: true, concesionarios: rows });
    }catch(err){
        console.error('Error fetching concesionarios', err); 
        res.status(500).json({ok:false, error: 'Error al obtener concesionarios'}); 
    }
})

router.get('/', async(req, res) =>{
    const{autonomia_min, plazas, color, concesionario, matricula} = req.query; 
    
    if(matricula){
        try{
            const [rows] = await pool.query(
                `SELECT v.*, c.nombre AS concesionario_nombre
                 FROM vehiculos v
                 LEFT JOIN concesionarios c ON v.id_concesionario = c.id_concesionario
                 WHERE v.matricula = ?`,
                [matricula.trim()]
            );

            return res.json({ok:true, vehiculos: rows});
        }catch(err){
            console.error('Error buscando vehículo por matrícula', err);
            return res.status(500).json({ok:false, error: 'Error buscando vehículo por matrícula' });
        }
    }

    // obtenemos todos los vehiculos con su concesionario asignado
    let sql = `SELECT v.*,                                 
    c.nombre AS concesionario_nombre 
    FROM vehiculos v LEFT JOIN concesionarios c ON v.id_concesionario = c.id_concesionario WHERE 1=1`;

    const params = []; 

    if (autonomia_min){
         const a = Number(autonomia_min);
        if(!Number.isNaN(a)){
            sql += ' AND v.autonomia_km >= ?'; 
            params.push(Number(autonomia_min)); 
        }
    }

    if (plazas){
        const p = Number(plazas); 
        if(!Number.isNaN(p)){
            sql += ' AND v.numero_plazas >= ?'; 
            params.push(p);
        }
    } 
    if (color) { sql += ' AND v.color = ?'; params.push(color); }

    if (concesionario && concesionario !== 'all') {
        const cId = Number(concesionario);
        if (!Number.isNaN(cId)) {
        sql += ' AND v.id_concesionario = ?';
        params.push(cId);
        }
    }

    try{
        const [rows] = await pool.query(sql, params); 
        res.json({ok:true, vehiculos: rows}); 
    }catch(err){
         console.error(err); res.status(500).json({ error: 'Error listando vehículos' });
    }
})


router.get('/vehicles/colors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT color FROM vehiculos WHERE color IS NOT NULL AND color <> ""');
    const colors = rows.map(r => r.color);
    res.json({ ok: true, colors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al obtener colores' });
  }
})

router.post('/', async(req, res) =>{
    const { matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario } = req.body;
    try {
        const [result] = await pool.query(
        `INSERT INTO vehiculos (matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matricula, marca, modelo, ano_matriculacion || null, numero_plazas || null, autonomia_km || null, color || null, imagen || null, estado || 'disponible', id_concesionario || null]
        );
        res.json({ ok: true, id_vehiculo: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando vehículo' });
    }
}); 

router.patch('/:id', async(req, res) =>{
    const id = Number(req.params.id);
    const fields = [];
    const values = [];
    if (req.body.estado !== undefined) { fields.push('estado = ?'); values.push(req.body.estado); }
    if (req.body.imagen !== undefined) { fields.push('imagen = ?'); values.push(req.body.imagen); }
    // ... añade más si quieres
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    try {
        values.push(id);
        await pool.query(`UPDATE vehiculos SET ${fields.join(', ')} WHERE id_vehiculo = ?`, values);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando vehículo' });
    }
}); 

module.exports = router;