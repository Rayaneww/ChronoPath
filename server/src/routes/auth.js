const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { randomUUID } = require('crypto');
const pool = require('../db/pool');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const id = randomUUID();
      const password_hash = await bcrypt.hash(password, 12);
      await pool.query(
        'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [id, email, password_hash]
      );
      res.status(201).json({ token: signToken(id), user: { id, email } });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email déjà utilisé' });
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

module.exports = router;
