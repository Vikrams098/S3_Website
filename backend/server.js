require('dotenv').config();
const express = require('express');
const cors = require('cors');

const menuRoutes        = require('./routes/menu');
const orderRoutes       = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ success: true, message: "KV's Cafe API is running" }));

app.use('/api/menu',         menuRoutes);
app.use('/api/orders',       orderRoutes);
app.use('/api/reservations', reservationRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong.' });
});

app.listen(PORT, () => console.log(`KV's Cafe API → http://localhost:${PORT}`));
