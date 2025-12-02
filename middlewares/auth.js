function ensureAuthenticated(req, res, next){
    if(req.session && req.session.user) return next(); 
    return res.status(401).json({error: 'No autentificado'});
}

function ensureAdmin(req, res, next){
    if (req.session && req.session.user && req.session.user.rol === 'admin') return next();
    return res.status(403).json({ error: 'Acceso denegado' });
}

module.exports = { ensureAuthenticated, ensureAdmin };