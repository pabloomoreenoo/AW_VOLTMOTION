const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

// registro de usuario
router.post('/register', async(req, res)=>{
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

// inicio de sesion
router.post('/login', async(req, res)=>{
    const {correo, contrasena} = req.body; 
    try{
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
        const user = rows[0];
        const ok = await bcrypt.compare(contrasena, user.contrasena);
        if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
        // guardar sesión
        req.session.user = { id: user.id_usuario, nombre: user.nombre, rol: user.rol, id_concesionario: user.id_concesionario };
        res.json({ ok: true, user: req.session.user });
    }catch(err){
        console.error(err); res.status(500).json({ error: 'Error login' });
    }
});

// cerrar sesion
router.post('/logout', (req, res) =>{
    req.session.destroy(err =>{
        if(err) return res.status(500).json({error: 'Error cerrando la sesion'}); 
        res.json({ok: true}); 
    });
});

router.get('/whoami', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.json({ ok: false, user: null });
    }

    const { id_usuario, nombre, correo, rol } = req.session.user;
    res.json({
        ok: true,
        user: { id_usuario, nombre, correo, rol }
    });
});


module.exports = router;