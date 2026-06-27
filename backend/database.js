const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'cafe.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    price       INTEGER NOT NULL,
    category    TEXT    NOT NULL,
    badge       TEXT,
    emoji       TEXT,
    bg_class    TEXT
  );

  CREATE TABLE IF NOT EXISTS specials (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    icon         TEXT,
    name         TEXT NOT NULL,
    description  TEXT,
    tag          TEXT,
    tag_class    TEXT,
    accent_class TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name        TEXT    NOT NULL,
    phone                TEXT    NOT NULL,
    order_type           TEXT    DEFAULT 'dine-in',
    table_number         TEXT,
    special_instructions TEXT,
    items                TEXT    NOT NULL,
    total                INTEGER NOT NULL,
    status               TEXT    DEFAULT 'pending',
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    phone            TEXT NOT NULL,
    date             TEXT NOT NULL,
    time_slot        TEXT NOT NULL,
    guests           TEXT NOT NULL,
    special_requests TEXT,
    status           TEXT DEFAULT 'pending',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Seed menu items ──────────────────────────────────────────────────────────
const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
if (menuCount.c === 0) {
  const ins = db.prepare(
    'INSERT INTO menu_items (name, description, price, category, badge, emoji, bg_class) VALUES (?,?,?,?,?,?,?)'
  );
  const seed = db.transaction(rows => { for (const r of rows) ins.run(...r); });
  seed([
    // Mains
    ["KV's Club Sandwich", "Triple-decker toasted bread with grilled chicken, crispy bacon, lettuce, tomato, and KV's house mayo.", 280, 'mains', "Chef's Pick", '🥪', 'bg-red'],
    ['Avocado Toast', 'Smashed avocado on thick sourdough, topped with cherry tomatoes, feta, chilli flakes, and a poached egg.', 240, 'mains', null, '🥑', 'bg-yellow'],
    ['Grilled Veggie Wrap', 'Zucchini, bell peppers, hummus, and rocket in a charred whole-wheat wrap with tahini drizzle.', 220, 'mains', 'Vegan', '🌯', 'bg-green'],
    ['Pasta Arrabiata', 'Penne in a spicy San Marzano tomato sauce with garlic, fresh basil, and shaved parmesan.', 290, 'mains', null, '🍝', 'bg-brown'],
    ['Belgian Waffle', 'Fluffy deep-pocketed waffle, served warm with whipped cream, maple syrup, and seasonal berries.', 260, 'mains', 'Popular', '🧇', 'bg-orange'],
    ['Signature Cold Brew', '18-hour cold-steeped single-origin coffee, served over ice with a hint of vanilla and oat milk.', 180, 'mains', null, '☕', 'bg-teal'],
    // Starters
    ['Bruschetta', 'Toasted ciabatta with vine tomatoes, fresh basil, garlic, and a drizzle of aged balsamic.', 180, 'starters', null, '🍞', 'bg-orange'],
    ['Soup of the Day', "Ask your server for today's freshly made soup, served with warm crusty bread.", 160, 'starters', 'Daily', '🍲', 'bg-teal'],
    ['Spring Rolls', 'Crispy vegetarian rolls filled with glass noodles, cabbage, and carrots, served with sweet chilli dip.', 200, 'starters', null, '🥢', 'bg-green'],
    ['Garlic Bread', 'Thick slices of toasted sourdough brushed with herb butter and roasted garlic.', 120, 'starters', null, '🧄', 'bg-brown'],
    // Desserts
    ['Tiramisu', 'Classic Italian dessert — espresso-soaked ladyfingers, mascarpone cream, and a dusting of cocoa.', 220, 'desserts', null, '🍰', 'bg-brown'],
    ['Red Velvet Cake', 'House-baked red velvet layered with cream cheese frosting. Made fresh each morning.', 200, 'desserts', 'Limited', '🎂', 'bg-red'],
    ['Chocolate Lava Cake', 'Warm dark chocolate cake with a molten centre, served with a scoop of vanilla ice cream.', 240, 'desserts', "Chef's Pick", '🍫', 'bg-yellow'],
    ['Panna Cotta', 'Silky vanilla panna cotta with a seasonal berry compote and edible flower garnish.', 180, 'desserts', null, '🍮', 'bg-teal'],
    // Beverages
    ['Espresso', 'A perfect single or double shot of our house-blend single-origin espresso.', 100, 'beverages', null, '☕', 'bg-brown'],
    ['Matcha Latte', 'Ceremonial-grade matcha whisked to perfection with steamed oat milk. Calming and earthy.', 180, 'beverages', null, '🍵', 'bg-green'],
    ['Fresh Orange Juice', 'Freshly squeezed Valencia oranges — nothing added, nothing taken away.', 140, 'beverages', null, '🍊', 'bg-orange'],
    ['Smoothie of the Day', "Ask your server for today's blend. Made with seasonal fruits and no added sugar.", 160, 'beverages', 'Daily', '🥤', 'bg-teal'],
  ]);
}

// ── Seed specials ────────────────────────────────────────────────────────────
const spCount = db.prepare('SELECT COUNT(*) as c FROM specials').get();
if (spCount.c === 0) {
  const ins = db.prepare(
    'INSERT INTO specials (icon, name, description, tag, tag_class, accent_class) VALUES (?,?,?,?,?,?)'
  );
  db.transaction(rows => { for (const r of rows) ins.run(...r); })([
    ['🍔', "KV's Signature Burger", "Double smash patty, aged cheddar, caramelised onions, house pickles, and KV's secret sauce in a brioche bun. Weekend only.", 'Weekend Special', 'tag-clay', 'accent-clay'],
    ['🍳', 'Big Brunch Platter', 'Scrambled eggs, grilled sausages, sourdough toast, roasted tomatoes, sautéed mushrooms, and fresh OJ. The full works.', 'Sunday Brunch', 'tag-yellow', 'accent-turmeric'],
    ['🎂', 'Red Velvet Cake Slice', 'House-baked red velvet layered with cream cheese frosting. Made fresh each morning — limited to 20 slices per day.', 'Limited Daily', 'tag-green', 'accent-green'],
  ]);
}

module.exports = db;
