require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool }  = require('pg');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Neon database connection ──────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── CORS — only allow your actual domain ─────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
    : (process.env.NODE_ENV === 'production' ? false : '*'),
}));

app.use(express.json());
app.use(express.static('public'));

// ── Rate limiting ─────────────────────────────────────────────────────
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const confirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

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
app.post('/create-payment-intent', paymentLimiter, async (req, res) => {
  const { amount } = req.body;

  // Strict amount validation — must be a number between $1 and $10,000
  if (!amount || isNaN(amount) || amount <= 0 || amount > 10000) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:               Math.round(amount * 100),
      currency:             'usd',
      payment_method_types: ['card'],
      metadata: { fundraiser: 'UL Industrial Design Donation Fundraiser' },
    });

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
app.post('/confirm-donation', confirmLimiter, async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid paymentIntentId.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not succeeded.' });
    }

    await pool.query(
      `UPDATE donations SET status = 'succeeded'
       WHERE stripe_payment_intent_id = $1`,
      [paymentIntentId]
    );

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
