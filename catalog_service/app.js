
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;
const DB_PATH = process.env.DB_PATH || './catalog.db';

// Persistent SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to catalog database.');
  }
});

db.configure('busyTimeout', 5000);

// Initialize the catalog with the four required books
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      price INTEGER NOT NULL CHECK(price >= 0),
      quantity INTEGER NOT NULL CHECK(quantity >= 0)
    )
  `);

  const books = [
    [1, 'How to get a good grade in DOS in 40 minutes a day.', 'distributed systems', 60, 5],
    [2, 'RPCs for Noobs.', 'distributed systems', 50, 5],
    [3, 'Xen and the Art of Surviving Undergraduate School.', 'undergraduate school', 30, 5],
    [4, 'Cooking for the Impatient Undergrad.', 'undergraduate school', 20, 5]
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO books
    (id, title, topic, price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `);

  books.forEach(book => stmt.run(book));
  stmt.finalize();
});

// Validate book IDs
function parseBookId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET /search/:topic
app.get('/search/:topic', (req, res) => {
  const topic = req.params.topic.trim().toLowerCase();

  db.all(
    'SELECT id, title FROM books WHERE topic = ? ORDER BY id',
    [topic],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      console.log(`SEARCH topic="${topic}" results=${rows.length}`);
      res.json(rows);
    }
  );
});

// GET /info/:id
app.get('/info/:id', (req, res) => {
  const id = parseBookId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  db.get(
    'SELECT title, quantity, price FROM books WHERE id = ?',
    [id],
    (err, book) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      console.log(`INFO item=${id}`, book);
      res.json(book);
    }
  );
});

// GET /query/:id
app.get('/query/:id', (req, res) => {
  const id = parseBookId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  db.get(
    'SELECT id, title, topic, price, quantity FROM books WHERE id = ?',
    [id],
    (err, book) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      console.log(`QUERY item=${id}`);
      res.json(book);
    }
  );
});

// PUT /update/:id
// Supports setting price/quantity or changing stock by a delta.
// Negative stock changes are atomic and cannot make stock negative.
app.put('/update/:id', (req, res) => {
  const id = parseBookId(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  const { quantity, price, delta } = req.body || {};

  if (
    quantity === undefined &&
    price === undefined &&
    delta === undefined
  ) {
    return res.status(400).json({
      error: 'Provide quantity, price, or delta'
    });
  }

  if (quantity !== undefined && delta !== undefined) {
    return res.status(400).json({
      error: 'Use either quantity or delta, not both'
    });
  }

  if (
    (quantity !== undefined &&
      (!Number.isSafeInteger(quantity) || quantity < 0)) ||
    (price !== undefined &&
      (!Number.isSafeInteger(price) || price < 0)) ||
    (delta !== undefined &&
      !Number.isSafeInteger(delta))
  ) {
    return res.status(400).json({
      error: 'Invalid quantity, price, or delta'
    });
  }

  const sql = `
    UPDATE books
    SET
      quantity = CASE
        WHEN ? IS NOT NULL THEN ?
        ELSE quantity + COALESCE(?, 0)
      END,
      price = COALESCE(?, price)
    WHERE id = ?
      AND (
        CASE
          WHEN ? IS NOT NULL THEN ?
          ELSE quantity + COALESCE(?, 0)
        END
      ) >= 0
  `;

  const q = quantity === undefined ? null : quantity;
  const d = delta === undefined ? null : delta;
  const p = price === undefined ? null : price;

  db.run(sql, [q, q, d, p, id, q, q, d], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return db.get(
        'SELECT id, quantity FROM books WHERE id = ?',
        [id],
        (lookupErr, book) => {
          if (lookupErr) {
            return res.status(500).json({
              error: lookupErr.message
            });
          }

          if (!book) {
            return res.status(404).json({
              error: 'Book not found'
            });
          }

          return res.status(409).json({
            error: 'Insufficient stock'
          });
        }
      );
    }

    db.get(
      'SELECT id, title, price, quantity FROM books WHERE id = ?',
      [id],
      (readErr, book) => {
        if (readErr) {
          return res.status(500).json({
            error: readErr.message
          });
        }

        console.log(`UPDATE item=${id}`, book);
        res.json({
          message: 'Book updated successfully',
          book
        });
      }
    );
  });
});

// Start catalog microservice
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Catalog service running on port ${PORT}`);
});
