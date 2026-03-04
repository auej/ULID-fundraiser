require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Neon database connection ──────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.static('public'));

// ── GET /stats ────────────────────────────────────────────────────────
app.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS donors
       FROM donations WHERE status = 'succeeded'`
    );
    const { total, donors } = result.rows[0];
    res.json({ total: parseFloat(total), donors: parseInt(donors) });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /create-payment-intent ───────────────────────────────────────
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { fundraiser: 'UL Industrial Design Donation Fundraiser' },
    });

    // Save pending donation to database
    await pool.query(
      `INSERT INTO donations (stripe_payment_intent_id, amount, status)
       VALUES ($1, $2, 'pending')`,
      [paymentIntent.id, amount]
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /confirm-donation ────────────────────────────────────────────
app.post('/confirm-donation', async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Missing paymentIntentId.' });
  }

  try {
    // Verify with Stripe the payment actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not succeeded.' });
    }

    // Mark as succeeded in database
    await pool.query(
      `UPDATE donations SET status = 'succeeded'
       WHERE stripe_payment_intent_id = $1`,
      [paymentIntentId]
    );

    // Return fresh totals
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS donors
       FROM donations WHERE status = 'succeeded'`
    );
    const { total, donors } = result.rows[0];
    res.json({ success: true, total: parseFloat(total), donors: parseInt(donors) });
  } catch (err) {
    console.error('Confirm error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Server running at http://localhost:${PORT}`);
});
