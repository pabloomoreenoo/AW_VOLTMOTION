// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Error interno del servidor'
    });
};

