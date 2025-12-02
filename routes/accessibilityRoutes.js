const express = require('express');
const router = express.Router();

router.post('/prefs', (req, res) => {
  // ejemplo: { contraste: 'alto', fontSize: '120' }
  req.session.accessibility = req.body;
  res.json({ ok: true });
});

router.get('/prefs', (req, res) => {
  res.json(req.session.accessibility || {});
});


module.exports = router;