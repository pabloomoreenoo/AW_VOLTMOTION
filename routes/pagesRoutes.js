const express = require('express');
const pool = require('../db'); 
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');
const router = express.Router();


router.get(['/', '/index.html'], (req, res) => {
  res.render('index'); // index.ejs
});

// vehiculos (opcional: precargar concesionarios)
router.get(['/vehiculos', '/vehiculos.html'], async (req, res) => {
  try {
    const [conces] = await pool.query('SELECT id_concesionario, nombre, ciudad FROM concesionarios ORDER BY nombre');
    res.render('vehiculos', { concesionarios: conces || [] });
  } catch (err) {
    console.error('Error al renderizar vehiculos', err);
    res.render('vehiculos', { concesionarios: [] });
  }
});

// reservas
router.get(['/reservas', '/reservas.html'], (req, res) => {
  // Puedes proteger la vista con middleware o dejar que el cliente muestre mensaje si no logueado
  res.render('reservas');
});


router.get('/user', ensureAuthenticated, (req, res) => {
  res.render('user', { user: req.session.user });
});


router.get('/admin', ensureAuthenticated, ensureRole('admin'), (req, res) => {
  res.render('admin', { user: req.session.user });
});

router.get('/miActividad', ensureAuthenticated, (req, res) =>{
  res.render('miActividad', {user: req.session.user}); 
}); 

router.get('/accesibilidad', ensureAuthenticated, (req, res) => {
  res.render('accesibilidad', { user: req.session.user });
});

router.get('/gestionVehiculos', ensureAuthenticated, (req, res) => {
  res.render('gestionVehiculos', { user: req.session.user });
});

router.get('/gestionReservas', ensureAuthenticated, (req, res) => {
  res.render('gestionReservas', { user: req.session.user });
});

router.get('/gestionConcesionarios', ensureAuthenticated, (req, res) => {
  res.render('gestionConcesionarios', { user: req.session.user });
});

router.get('/estadisticas', ensureAuthenticated, (req, res) => {
  res.render('estadisticas', { user: req.session.user });
});

module.exports = router;