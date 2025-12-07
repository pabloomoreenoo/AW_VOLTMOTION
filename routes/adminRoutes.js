const express = require('express');
const multer = require('multer'); 
const pool = require('../db'); 
const {ensureAdmin} = require('../middlewares/auth'); 
const jsonLoader = require('../utils/jsonLoader'); 
const bcrypt = require('bcrypt'); 

const router = express.Router();
const upload = multer({dest: 'uploads/'});



// ruta basica para añadir vehiculos
router.post('/addVehiculos', ensureAdmin, async (req, res) => {
    const { matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, id_concesionario } = req.body;
    try{
        const [result] = await pool.query(
        `INSERT INTO vehiculos (matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, id_concesionario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matricula, marca, modelo, ano_matriculacion, numero_plazas, autonomia_km, color, imagen, id_concesionario]
        );
        res.json({ ok: true, id: result.insertId });
    }catch(err){
        console.error(err); res.status(500).json({ error: 'Error creando vehículo' });
    }
})

// ruta basica para añadir concesionarios
router.post('/addConcesionario', ensureAdmin, async (req, res) => {
    const { nombre, ciudad, direccion, telefono } = req.body;

    // Validación básica (opcional pero recomendado)
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre del concesionario es obligatorio' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO concesionarios 
            (nombre, ciudad, direccion, telefono)
            VALUES (?, ?, ?, ?)`,
            [nombre.trim(), ciudad || null, direccion || null, telefono || null]
        );

        res.json({
            ok: true,
            message: 'Concesionario añadido correctamente',
            id: result.insertId,
            concesionario: { id_concesionario: result.insertId, nombre, ciudad, direccion, telefono }
        });
    } catch (err) {
        console.error('Error al añadir concesionario:', err);
        // Si hay error de duplicado o clave única (por si añades UNIQUE más tarde)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe un concesionario con ese nombre' });
        }
        res.status(500).json({ error: 'Error creando concesionario', details: err.message });
    }
});

router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre, correo, rol, telefono, id_concesionario, preferencias_accesibilidad
       FROM usuarios ORDER BY nombre ASC`
    );

    // si las prefs vienen en String parseamos
    const usuarios = rows.map(u => {
      try {
        u.preferencias_accesibilidad = u.preferencias_accesibilidad ? JSON.parse(u.preferencias_accesibilidad) : null;
      } catch (_) {
        u.preferencias_accesibilidad = null;
      }
      return u;
    });

    res.json({ ok: true, usuarios });
  } catch (err) {
    console.error('Error listando usuarios', err);
    res.status(500).json({ ok: false, error: 'Error listando usuarios' });
  }
});

router.patch('/users/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalido' });

  const { nombre, correo, rol, telefono, id_concesionario, preferencias_accesibilidad, nueva_contrasena } = req.body;

  // validaciones bsicas
  if (correo && typeof correo === 'string' && correo.trim() === '') {
    return res.status(400).json({ error: 'Correo invalido' });
  }

  try {
    // cnstruir qery
    const updates = [];
    const values = [];

    if (typeof nombre !== 'undefined') { updates.push('nombre = ?'); values.push(nombre || null); }
    if (typeof correo !== 'undefined') { updates.push('correo = ?'); values.push(correo || null); }
    if (typeof rol !== 'undefined') { updates.push('rol = ?'); values.push(rol || null); }
    if (typeof telefono !== 'undefined') { updates.push('telefono = ?'); values.push(telefono || null); }
    if (typeof id_concesionario !== 'undefined') { updates.push('id_concesionario = ?'); values.push(id_concesionario || null); }
    if (typeof preferencias_accesibilidad !== 'undefined') {
      
      let pref = null;
      if (preferencesIsValid(preferencias_accesibilidad)) pref = JSON.stringify(preferencias_accesibilidad);
      else if (typeof preferencias_accesibilidad === 'string' && preferencias_accesibilidad.trim() !== '') {
        try {
          const parsed = JSON.parse(preferencias_accesibilidad);
          pref = JSON.stringify(parsed);
        } catch (e) {
          return res.status(400).json({ error: 'Prefrencias con formato invalido' });
        }
      } else {
        pref = null;
      }
      updates.push('preferencias_accesibilidad = ?'); values.push(pref);
    }

    if (nueva_contrasena && typeof nueva_contrasena === 'string' && nueva_contrasena.trim() !== '') {
      const hashed = await bcrypt.hash(nueva_contrasena, 10);
      updates.push('contrasena = ?'); values.push(hashed);
    }

    if (updates.length === 0) {
      return res.json({ ok: true, message: 'Nada que actualizar' });
    }

    values.push(id); // para WHERE
    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, values);

    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Error actualizando usuario', err);
    res.status(500).json({ ok: false, error: 'Error actualizando usuario' });
  }
});

// nos ayuda a validar si las prefs vienen dads como objetosimple
function preferencesIsValid(pref) {
  return pref && typeof pref === 'object' && !Array.isArray(pref);
}


module.exports = router;