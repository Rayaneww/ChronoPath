const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const routeRouter = require('./routes/route');
const savedRouter = require('./routes/saved');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/route', routeRouter);
app.use('/api/routes/saved', savedRouter);

module.exports = app;
