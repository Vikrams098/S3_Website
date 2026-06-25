const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', (req, res) => {
  const { name, phone, date, time_slot, guests, special_requests } = req.body;

  if (!name || !phone || !date || !time_slot || !guests) {
    return res.status(400).json({ success: false, error: 'Name, phone, date, time slot, and guests are required.' });
  }

  // Limit to 5 active bookings per time slot
  const conflict = db.prepare(`
    SELECT COUNT(*) as c FROM reservations
    WHERE date = ? AND time_slot = ? AND status NOT IN ('cancelled')
  `).get(date, time_slot);

  if (conflict.c >= 5) {
    return res.status(409).json({ success: false, error: 'This time slot is fully booked. Please choose another slot.' });
  }

  const result = db.prepare(`
    INSERT INTO reservations (name, phone, date, time_slot, guests, special_requests)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), phone.trim(), date, time_slot, guests, special_requests?.trim() || null);

  res.status(201).json({
    success: true,
    data: { id: result.lastInsertRowid, name: name.trim(), date, time_slot, guests, status: 'pending' }
  });
});

router.get('/', (req, res) => {
  const { date } = req.query;
  const reservations = date
    ? db.prepare('SELECT * FROM reservations WHERE date = ? ORDER BY time_slot').all(date)
    : db.prepare('SELECT * FROM reservations ORDER BY date, time_slot').all();
  res.json({ success: true, data: reservations });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status.' });
  const result = db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, error: 'Reservation not found.' });
  res.json({ success: true, data: { id: parseInt(req.params.id), status } });
});

module.exports = router;
