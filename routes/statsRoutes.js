// routes/statsRoutes.js
const express = require('express');
const pool = require('../db'); 
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth'); 
const router = express.Router();


router.get('/', /* ensureAuthenticated, */ async (req, res) => {
  try {
    // 1) Totales y porcentaje canceladas
    const [totRows] = await pool.query(
      `SELECT 
         SUM(estado = 'cancelado') AS canceladas,
         SUM(estado = 'finalizada') AS finalizadas,
         SUM(estado = 'activa') AS activas,
         COUNT(*) AS total
       FROM reservas`
    );
    const totals = totRows[0] || { canceladas: 0, finalizadas: 0, activas: 0, total: 0 };
    const cancelPct = totals.total ? (Number(totals.canceladas) / Number(totals.total)) * 100 : 0;

    // 2) Top veh por numero de reservas 
    const [vehRows] = await pool.query(
      `SELECT v.id_vehiculo, v.marca, v.modelo, v.matricula, COALESCE(COUNT(r.id_reserva),0) AS reservas
       FROM vehiculos v
       LEFT JOIN reservas r ON v.id_vehiculo = r.id_vehiculo
       GROUP BY v.id_vehiculo
       ORDER BY reservas DESC
       LIMIT 10`
    );

    // 3) Top concesionarios por reservas 
    const [conRows] = await pool.query(
      `SELECT c.id_concesionario, c.nombre, c.ciudad, COALESCE(COUNT(r.id_reserva),0) AS reservas
       FROM concesionarios c
       LEFT JOIN vehiculos v ON v.id_concesionario = c.id_concesionario
       LEFT JOIN reservas r ON r.id_vehiculo = v.id_vehiculo
       GROUP BY c.id_concesionario
       ORDER BY reservas DESC
       LIMIT 10`
    );

    // 4) Top usuarios reservas
    const [userRows] = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.correo, COALESCE(COUNT(r.id_reserva),0) AS reservas
       FROM usuarios u
       LEFT JOIN reservas r ON r.id_usuario = u.id_usuario
       GROUP BY u.id_usuario
       ORDER BY reservas DESC
       LIMIT 10`
    );

    res.json({
      ok: true,
      totals,
      cancelPct: Number(cancelPct.toFixed(2)),
      topVehicles: vehRows,
      topConcesionarios: conRows,
      topUsuarios: userRows
    });
  } catch (err) {
    console.error('Error /api/stats', err);
    res.status(500).json({ ok: false, error: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
