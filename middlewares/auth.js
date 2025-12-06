function ensureAuthenticated(req, res, next){
    if(req.session && req.session.user) return next(); 
    return res.status(401).json({error: 'No autentificado'});
}

function ensureAdmin(req, res, next){
    if (req.session && req.session.user && req.session.user.rol === 'admin') return next();
    return res.status(403).json({ error: 'Acceso denegado' });
}

function ensureRole(requiredRole) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) return res.status(401).json({ error: 'No autenticado' });
      return res.redirect('/');
    }
    const actual = req.session.user.rol;
    if (actual === requiredRole) return next();
    // no autorizado
    if (req.xhr || req.headers.accept?.includes('application/json')) return res.status(403).json({ error: 'No autorizado' });
    return res.status(403).render('403', { user: req.session.user, message: 'No tienes permisos' });
  };
}

module.exports = { ensureAuthenticated, ensureAdmin, ensureRole };