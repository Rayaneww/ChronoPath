const express = require('express');
const { body, validationResult } = require('express-validator');
const { randomUUID } = require('crypto');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM saved_routes WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post(
  '/',
  [
    body('activite').isIn(['marche', 'course', 'velo']),
    body('duree').isInt({ min: 5, max: 180 }),
    body('distance').isFloat({ min: 0 }),
    body('geojson').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { activite, duree, distance, denivele, geojson } = req.body;
    const now = new Date();
    const label = `${activite.charAt(0).toUpperCase() + activite.slice(1)} ${duree}min`;
    const nom = `${label} – ${now.getDate()} ${now.toLocaleString('fr-FR', { month: 'short' })}`;
    const id = randomUUID();

    try {
      await pool.query(
        'INSERT INTO saved_routes (id, user_id, nom, activite, duree, distance, denivele, geojson) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.userId, nom, activite, duree, distance, denivele || null, JSON.stringify(geojson)]
      );
      const [rows] = await pool.query('SELECT * FROM saved_routes WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } catch {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM saved_routes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Itinéraire introuvable' });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
