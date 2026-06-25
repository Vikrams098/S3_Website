const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', (req, res) => {
  const { customer_name, phone, order_type, table_number, special_instructions, items } = req.body;

  if (!customer_name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Name, phone, and at least one item are required.' });
  }

  // Resolve prices from DB to prevent client-side tampering
  const ids = items.map(i => i.id);
  const placeholders = ids.map(() => '?').join(',');
  const dbItems = db.prepare(`SELECT * FROM menu_items WHERE id IN (${placeholders})`).all(...ids);

  if (dbItems.length !== ids.length) {
    return res.status(400).json({ success: false, error: 'One or more menu items not found.' });
  }

  const priceMap = Object.fromEntries(dbItems.map(m => [m.id, m]));
  let total = 0;
  const enriched = items.map(i => {
    const m = priceMap[i.id];
    const qty = Math.max(1, parseInt(i.quantity) || 1);
    total += m.price * qty;
    return { id: i.id, name: m.name, price: m.price, quantity: qty };
  });

  const result = db.prepare(`
    INSERT INTO orders (customer_name, phone, order_type, table_number, special_instructions, items, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer_name.trim(),
    phone.trim(),
    order_type || 'dine-in',
    table_number?.trim() || null,
    special_instructions?.trim() || null,
    JSON.stringify(enriched),
    total
  );

  res.status(201).json({
    success: true,
    data: { id: result.lastInsertRowid, customer_name: customer_name.trim(), total, status: 'pending', items: enriched }
  });
});

router.get('/', (req, res) => {
  const { status } = req.query;
  const orders = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.json({ success: true, data: orders.map(o => ({ ...o, items: JSON.parse(o.items) })) });
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });
  res.json({ success: true, data: { ...order, items: JSON.parse(order.items) } });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status.' });
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ success: false, error: 'Order not found.' });
  res.json({ success: true, data: { id: parseInt(req.params.id), status } });
});

module.exports = router;
