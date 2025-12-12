// routes/statsRoutes.js
const express = require('express');
const pool = require('../db'); 
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth'); 
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // total reservas
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM reservas');
    // reservas canceladas
    const [[{ canceladas }]] = await pool.query("SELECT COUNT(*) AS canceladas FROM reservas WHERE LOWER(estado) LIKE '%cancelada%'");
    // top vehiculos por reservas
    const [topVehicles] = await pool.query(`
      SELECT v.id_vehiculo, v.marca, v.modelo, v.matricula, COUNT(r.id_reserva) AS reservas
      FROM vehiculos v
      LEFT JOIN reservas r ON r.id_vehiculo = v.id_vehiculo
      GROUP BY v.id_vehiculo
      ORDER BY reservas DESC
      LIMIT 6
    `);
    // top concesionarios
    const [topConcesionarios] = await pool.query(`
      SELECT c.id_concesionario, c.nombre, c.ciudad, COUNT(r.id_reserva) AS reservas
      FROM concesionarios c
      LEFT JOIN vehiculos v ON v.id_concesionario = c.id_concesionario
      LEFT JOIN reservas r ON r.id_vehiculo = v.id_vehiculo
      GROUP BY c.id_concesionario
      ORDER BY reservas DESC
      LIMIT 6
    `);
    // top usuarios
    const [topUsuarios] = await pool.query(`
      SELECT u.id_usuario, u.nombre, u.correo, COUNT(r.id_reserva) AS reservas
      FROM usuarios u
      LEFT JOIN reservas r ON r.id_usuario = u.id_usuario
      GROUP BY u.id_usuario
      ORDER BY reservas DESC
      LIMIT 6
    `);

    const cancelPct = total > 0 ? Math.round((canceladas / total) * 100) : 0;

    res.json({
      ok: true,
      totals: { total: Number(total), canceladas: Number(canceladas) },
      cancelPct,
      topVehicles,
      topConcesionarios,
      topUsuarios
    });
  } catch (err) {
    console.error('Error /api/stats', err);
    res.status(500).json({ ok: false, error: 'Error calculando estadísticas' });
  }
});

module.exports = router;
