require('dotenv').config();          // cargamos las variables de entorno desde el archivo .env
const express = require('express');    // importamos el framework Express para crear el servidor web
const helmet = require('helmet');      // importamos Helmet para mejorar la seguridad de la aplicación
const bodyParser = require('body-parser'); // importamos body-parser para manejar las solicitudes entrantes
const path = require('path');        // importamos el módulo path para manejar rutas de archivos
const session = require('express-session'); // importamos express-session para manejar sesiones de usuario

const {cargarDatosIniciales} = require('./uploads/cargarJSON'); // importamos la función para cargar datos iniciales

const authRoutes = require('./routes/authRoutes'); 
const vehicleRoutes = require('./routes/vehiclesRoutes'); 
const reservasRoutes = require('./routes/reservasRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); 
const accessibilityRoutes = require('./routes/accessibilityRoutes');
const pagesRoutes = require('./routes/pagesRoutes'); 
const initialLoadRoutes = require('./routes/initialLoadRoutes');

const handleErrors = require('./middlewares/errorHandler'); // importamos el middleware para manejo de errores

const app = express(); // creamos una instancia de la aplicación Express
const PORT = process.env.PORT || 3000; // definimos el puerto en el que el servidor escuchará las solicitudes

// Helmet con CSP personalizada para permitir CDN de Bootstrap y estilos inline necesarios.
// Ajusta las URLs si usas otro CDN.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // permitir scripts desde self y CDN (y permitir inline si tienes scripts inline)
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      // permitir estilos desde self y CDN; Bootstrap necesita estilos
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      // imágenes desde self y data URIs (thumbnails, inline images)
      imgSrc: ["'self'", "data:"],
      // peticiones XHR / fetch (ajusta si necesitas más)
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      // fuentes si las cargas desde CDN
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));


app.use(express.urlencoded({ extended: true }));  // configuramos body-parser para manejar solicitudes con datos codificados en URL
app.use(express.json());               // configuramos body-parser para manejar solicitudes con datos en formato JSON                    

app.use(session({                       // configuramos express-session para manejar sesiones de usuario
    secret: process.env.SESSION_SECRET || 'mi_secreto', // clave secreta para firmar la cookie de sesión
    resave: false,                    // no guardar la sesión si no ha habido cambios
    saveUninitialized: false,          // no guardar sesiones no inicializadas
    cookie: { secure: false }          // en producción, establecer a true si se usa HTTPS
}));

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// CONFIGURAR VIEWS (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Exponer user a las vistas (si existe sesión)
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/initialLoad', initialLoadRoutes);

app.use('/', pagesRoutes);

app.use(express.static(path.join(__dirname, 'public'))); // servimos archivos estáticos desde la carpeta 'public'


app.use(handleErrors); 


cargarDatosIniciales().then((resultado) => {
    app.listen(PORT, () => {                     // el servidor comienza a escuchar en el puerto definido
    console.log(`Servidor escuchando en el puerto ${PORT}`); // mostramos un mensaje en la consola indicando que el servidor está activo
  });
});

