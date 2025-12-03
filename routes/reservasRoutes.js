const express = require('express');
const pool = require('../db'); 
const { ensureAuthenticated } = require('../middlewares/auth');
const router = express.Router();

// comprobar la disponibilidad de una reserva
async function isAvailable(id_vehiculo, inicio, fin){
    const [rows] = await pool.query(
        `SELECT * FROM reservas WHERE id_vehiculo = ? AND estado = 'activa'
     AND NOT (fecha_fin <= ? OR fecha_inicio >= ?)`,
     [id_vehiculo, inicio, fin]
    ); 
    return rows.length === 0;
}

// crear reserva
router.post('/', ensureAuthenticated, async (req, res) =>{
    const {id_vehiculo, fecha_inicio, fecha_fin} = req.body; 
    const id_usuario = req.session.user && req.session.user.id;
    if(!id_usuario) return res.status(401).json({error: 'No autorizado'}); 
    if(!id_vehiculo || !fecha_inicio || !fecha_fin){
        return res.status(400).json({error: 'Faltan datos obligatorios'}); 
    }
    try{
        // compruebo disponibilidad
        const disponible = await isAvailable(id_vehiculo, fecha_inicio, fecha_fin); 
        if(!disponible) return res.status(400).json({error: 'Vehiculo no disponible'}); 

         const [result] = await pool.query(
      `INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado)
       VALUES (?, ?, ?, ?, 'activa')`,
      [id_usuario, id_vehiculo, fecha_inicio, fecha_fin]
    );

    // marcar vehiculo como reservado temporalmente (opcional)
    await pool.query('UPDATE vehiculos SET estado = ? WHERE id_vehiculo = ?', ['reservado', id_vehiculo]);

    res.json({ ok: true, id_reserva: result.insertId });

    }catch(err){
        console.error(err); res.status(500).json({ error: 'Error creando reserva' });
    }
})

// mostrar reservas
router.get('/mias', ensureAuthenticated, async(req, res) =>{
    const id_usuario = req.session.user && req.session.user.id;
    if(!id_usuario) return res.status(401).json({error: 'No autorizado'});
    try{
        const [rows] = await pool.query(
      `SELECT r.*, v.matricula, v.marca, v.modelo FROM reservas r JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
       WHERE r.id_usuario = ? ORDER BY r.fecha_inicio DESC`,
      [id_usuario]
    );
    res.json(rows);
    }catch(err){
        console.error(err); res.status(500).json({ error: 'Error listando reservas' });
    }
})

module.exports = router;