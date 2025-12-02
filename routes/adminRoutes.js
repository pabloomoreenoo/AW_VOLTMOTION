const express = require('express');
const multer = require('multer'); 
const pool = require('../db'); 
const {ensureAdmin} = require('../middlewares/auth'); 
const jsonLoader = require('../utils/jsonLoader'); 

const router = express.Router();
const upload = multer({dest: 'uploads/'});

// endpoint para cargar desde JSON (por si tenemos que probar a cargar con otro metodo)
router.post('/cargar-json', ensureAdmin, upload.single('file'), async (req, res) => {
    try{
        const filePath = req.file.path;
        const report = await jsonLoader.loadVehiclesAndConcesionarios(filePath);
        res.json({ ok: true, report });
    }catch(err){
        console.error(err); 
        res.status(500).json({error: 'Error cargando JSON'}); 
    }
})

// ruta basica para añadir vehiculos
router.post('/vehiculos', ensureAdmin, async (req, res) => {
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


module.exports = router;