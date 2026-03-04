require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.static('public')); // serves your fundraiser.html from /public

// ── POST /create-payment-intent ──────────────────────────────────────
// Called by the frontend when user clicks "Confirm Donation"
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body; // amount in dollars (e.g. 25)

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100), // Stripe works in cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        fundraiser: 'UL Industrial Design Donation Fundraiser',
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /total ────────────────────────────────────────────────────────
// Returns the real total raised from Stripe (optional — for persistence)
app.get('/total', async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    const total = paymentIntents.data
      .filter(pi => pi.status === 'succeeded')
      .reduce((sum, pi) => sum + pi.amount, 0);

    res.json({ total: total / 100 }); // back to dollars
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Server running at http://localhost:${PORT}`);
});
