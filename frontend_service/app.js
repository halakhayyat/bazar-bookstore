
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Backend service addresses
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:5001';
const ORDER_URL = process.env.ORDER_URL || 'http://localhost:5002';

// Search books by topic
app.get('/search/:topic', async (req, res) => {
  try {
    const topic = req.params.topic;

    const result = await axios.get(
      `${CATALOG_URL}/search/${encodeURIComponent(topic)}`
    );

    console.log(`Search for topic: ${topic}`);
    console.log(result.data);

    res.json(result.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Catalog service error' }
    );
  }
});

// Get book information
app.get('/info/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const result = await axios.get(`${CATALOG_URL}/info/${id}`);

    console.log(`Info request for item: ${id}`);
    console.log(result.data);

    res.json(result.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Catalog service error' }
    );
  }
});

// Purchase a book
app.post('/purchase/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const result = await axios.post(`${ORDER_URL}/purchase/${id}`);

    console.log(`Purchase request for item: ${id}`);
    console.log(result.data);

    res.json(result.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Order service error' }
    );
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Frontend running on port 5000');
});
