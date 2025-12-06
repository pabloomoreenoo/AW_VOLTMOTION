const express = require('express');
const multer = require('multer'); 
const bcrypt = require('bcrypt');
const pool = require('../db');  

const router = express.Router();
const upload = multer({dest: 'uploads/'});



// ruta basica para añadir vehiculos
router.post('/addVehiculos', async (req, res) => {
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
router.post('/addConcesionario', async (req, res) => {
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

// registro de usuario
router.post('/addRegister', async(req, res)=>{
    const {nombre, correo, contrasena, telefono, id_concesionario} = req.body; 
    // validacion del correo
    const regex = /^[A-Za-z0-9._%+-]+@ucm\.es$/;
    if(!regex.test(correo))return res.status(400).json({error: 'El correo debe de ser el de la UCM'});

    try{
        const hashed = await bcrypt.hash(contrasena, 10); // encriptamos la contraseña
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, correo, contrasena, telefono, id_concesionario)
            VALUES (?, ?, ?, ?, ?)`,
            [nombre, correo, hashed, telefono || null, id_concesionario || null]
        );
        res.json({ok: true, id: result.insertId});
    }catch (err){
        console.error(err); 
        res.status(500).json({error: 'Error al crear usuario'}); 
    }

});


module.exports = router;