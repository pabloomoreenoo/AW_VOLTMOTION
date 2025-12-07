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

// ruta para poder ver tods las reservas
router.get('/', ensureAuthenticated, async(req, res)=>{
    if(!req.session.user) return res.status(401).json({ error: 'No autenticado' });

    try{
        const [rows] = await pool.query(
        `SELECT r.id_reserva, r.id_usuario, r.id_vehiculo, r.fecha_inicio, r.fecha_fin, r.estado,
                v.matricula, v.marca, v.modelo, v.imagen
        FROM reservas r
        LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
        ORDER BY r.fecha_inicio DESC`
        );
        res.json({ ok: true, reservas: rows });
    }catch(err){
        console.error(err); 
        res.status(500).json({error: 'Err listando reservas'})
    }
})

// mostrar reservas
router.get('/mias', ensureAuthenticated, async(req, res) =>{
    const id_usuario = req.session.user && req.session.user.id;
    if(!id_usuario) return res.status(401).json({error: 'No autorizado'});
    try{
        const [rows] = await pool.query(
      `SELECT r.id_reserva, r.id_usuario, r.id_vehiculo, r.fecha_inicio, r.fecha_fin, r.estado,
              v.matricula, v.marca, v.modelo, v.imagen
       FROM reservas r
       LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
       WHERE r.id_usuario = ?
       ORDER BY r.fecha_inicio DESC`,
      [id_usuario]
    );
    res.json({ok:true, reservas: rows});
    }catch(err){
        console.error(err); 
        res.status(500).json({ error: 'Error listando reservas' });
    }
}); 

// ruta para cancelar una reserva
router.post('/:id/cancel', ensureAuthenticated, async(req, res) =>{
    const id_usuario = req.session && req.session.user && req.session.user.id; 
    const idReserva = Number(req.params.id); 
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });
    if (!idReserva) return res.status(400).json({ error: 'ID reserva inválido' });

    const conn = await pool.getConnection(); 

    try{
        await conn.beginTransaction();

        // comprobar que la reserva pertenece al usuario y está activa
        const [rows] = await conn.query(
        'SELECT * FROM reservas WHERE id_reserva = ? FOR UPDATE',
        [idReserva]
        );
        if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = rows[0];
        if (reserva.estado !== 'activa') {
        await conn.rollback();
        return res.status(400).json({ error: 'Solo se pueden cancelar reservas activas' });
        }

        // marcar reserva como cancelada
        await conn.query('UPDATE reservas SET estado = ? WHERE id_reserva = ?', ['cancelada', idReserva]);

        // poner el vehículo a disponible
        if (reserva.id_vehiculo) {
        await conn.query('UPDATE vehiculos SET estado = ? WHERE id_vehiculo = ?', ['disponible', reserva.id_vehiculo]);
        }

        await conn.commit();
        res.json({ ok: true, message: 'Reserva cancelada' });
    }catch(err){
        await conn.rollback(); 
        console.error(err); 
        res.status(500).json({ok: false, error: 'Error cancelando la reserva'}); 
    }finally{
        conn.release(); 
    }
}); 

router.post('/:id/finish', ensureAuthenticated, async(req, res) =>{
    const id_usuario = req.session && req.session.user && req.session.user.id; 
    const idReserva = Number(req.params.id); 
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });
    if (!idReserva) return res.status(400).json({ error: 'ID reserva inválido' });

    const conn = await pool.getConnection(); 

    try{
        await conn.beginTransaction(); 

        const [rows] = await conn.query(
            'SELECT * FROM reservas WHERE id_reserva = ? FOR UPDATE',
            [idReserva]
        );
        if (!rows.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = rows[0];
        if (reserva.id_usuario !== id_usuario) {
            await conn.rollback();
            return res.status(403).json({ error: 'No tienes permiso para finalizar esta reserva' });
        }
        if (reserva.estado !== 'activa') {
            await conn.rollback();
            return res.status(400).json({ error: 'Solo se pueden finalizar reservas activas' });
        }

        await conn.query('UPDATE reservas SET estado = ? WHERE id_reserva = ?', ['finalizada', idReserva]);

        if (reserva.id_vehiculo) {
            await conn.query('UPDATE vehiculos SET estado = ? WHERE id_vehiculo = ?', ['disponible', reserva.id_vehiculo]);
        }

        await conn.commit();
        res.json({ ok: true, message: 'Reserva finalizada' });
    }catch(err){
        await conn.rollback();
        console.error('Error finalizando reserva', err);
        res.status(500).json({ ok: false, error: 'Error finalizando la reserva' });
    }finally{
        conn.release(); 
    }
}); 

module.exports = router;