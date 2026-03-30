const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);

module.exports = app;
