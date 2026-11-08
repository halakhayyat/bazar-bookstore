
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

const app = express();
app.use(express.json());

const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:5001';

// Persistent SQLite database for orders
const orderDb = new sqlite3.Database(
  process.env.ORDER_DB_PATH || './orders.db',
  (err) => {
    if (err) console.error('Database error:', err.message);
    else console.log('Connected to orders database.');
  }
);

// Create orders table
orderDb.run(`
  CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    time TEXT NOT NULL
  )
`);

// Purchase a book
app.post('/purchase/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    // 1. Get book information from Catalog
    const catalogResp = await axios.get(`${CATALOG_URL}/info/${id}`);
    const book = catalogResp.data;

    // 2. Request an atomic stock decrement from Catalog.
    // Catalog must reject this request when quantity is zero.
    try {
      await axios.put(`${CATALOG_URL}/update/${id}`, {
        decrement: 1
      });
    } catch (updateErr) {
      return res.status(updateErr.response?.status || 502).json(
        updateErr.response?.data || {
          error: 'Could not update stock'
        }
      );
    }

    // 3. Save the successful purchase
    const time = dayjs().format('MMM DD, YYYY, hh:mm:ss A');

    orderDb.run(
      'INSERT INTO orders (item_id, title, time) VALUES (?, ?, ?)',
      [id, book.title, time],
      function (err) {
        if (err) {
          console.error('Order database error:', err.message);
          return res.status(500).json({
            error: 'Order logging failed after stock decrement'
          });
        }

        console.log(`Purchase request received for item ${id}`);
        console.log(`bought book ${book.title}`);

        res.json({
          message: `Bought book: ${book.title}`,
          order_id: this.lastID,
          item_id: id,
          time
        });
      }
    );
  } catch (err) {
    console.error('Purchase error:', err.message);

    res.status(err.response?.status || 502).json(
      err.response?.data || { error: 'Catalog service unavailable' }
    );
  }
});

app.listen(5002, '0.0.0.0', () => {
  console.log('Order service running on port 5002');
});
