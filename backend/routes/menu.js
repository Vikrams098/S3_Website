const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { category } = req.query;
  const items = category
    ? db.prepare('SELECT * FROM menu_items WHERE category = ?').all(category.toLowerCase())
    : db.prepare('SELECT * FROM menu_items ORDER BY category, id').all();
  res.json({ success: true, data: items });
});

router.get('/specials', (req, res) => {
  const specials = db.prepare('SELECT * FROM specials').all();
  res.json({ success: true, data: specials });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM menu_items').all().map(r => r.category);
  res.json({ success: true, data: categories });
});

module.exports = router;
