// routes/accessibilityRoutes.js
const express = require('express');
const pool = require('../db');
const { ensureAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.get('/prefs', ensureAuthenticated, async (req, res) => {
  const id_usuario = req.session.user && req.session.user.id;
  if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });
  try {
    const [rows] = await pool.query('SELECT preferencias_accesibilidad FROM usuarios WHERE id_usuario = ?', [id_usuario]);
    const prefsRaw = rows && rows[0] ? rows[0].preferencias_accesibilidad : null;
    let prefs = null;
    try { prefs = prefsRaw ? JSON.parse(prefsRaw) : null; } catch(e){ prefs = null; }
    res.json({ ok: true, prefs });
  } catch (err) {
    console.error('Error obteniendo prefs:', err);
    res.status(500).json({ error: 'Error obteniendo preferencias' });
  }
});

router.post('/prefs', ensureAuthenticated, async (req, res) => {
  const id_usuario = req.session.user && req.session.user.id;
  if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });
  const prefs = req.body || {};
  try {
    await pool.query('UPDATE usuarios SET preferencias_accesibilidad = ? WHERE id_usuario = ?', [JSON.stringify(prefs), id_usuario]);
    res.json({ ok: true, prefs });
  } catch (err) {
    console.error('Error guardando prefs:', err);
    res.status(500).json({ error: 'Error guardando preferencias' });
  }
});

module.exports = router;

