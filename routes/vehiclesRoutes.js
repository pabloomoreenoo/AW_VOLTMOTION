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
    const{autonomia_min, plazas, color, concesionario} = req.query; 
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

module.exports = router;