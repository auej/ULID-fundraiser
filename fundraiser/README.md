# UL Industrial Design Donation Fundraiser

A real fundraiser page with Stripe payment processing.

---

## Setup (takes about 10 minutes)

### 1. Get your Stripe API keys

1. Go to [stripe.com](https://stripe.com) and create a free account
2. In your dashboard go to **Developers → API Keys**
3. Copy your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)
4. Use test keys while building — no real money is charged

---

### 2. Configure your environment

```bash
# Copy the example env file
cp .env.example .env

# Open .env and paste in your Stripe keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

Also open `public/index.html` and find this line near the bottom:
```js
const stripe = Stripe('pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY');
```
Replace it with your actual publishable key.

---

### 3. Install dependencies & run

```bash
npm install
npm run dev       # development (auto-restarts on changes)
# or
npm start         # production
```

Open [http://localhost:3001](http://localhost:3001) — the fundraiser is live!

---

### 4. Test a donation

Use Stripe's test card numbers (no real money):

| Card Number         | Result  |
|---------------------|---------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |
| 4000 0025 0000 3155 | 3D Secure (extra auth step) |

Use any future expiry (e.g. `12/34`) and any 3-digit CVV.

---

### 5. Deploy to the web

**Recommended: Render.com (free tier)**

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add your environment variables under **Environment**
7. Deploy — you'll get a public URL like `https://ul-fundraiser.onrender.com`

---

### Going live (real payments)

1. Complete Stripe's account verification
2. Switch to **live keys** (`sk_live_...` / `pk_live_...`) in your `.env` and HTML
3. Make sure your site is on **HTTPS** (Render handles this automatically)

---

## Project structure

```
fundraiser/
├── server.js          # Express backend — handles Stripe API calls
├── package.json
├── .env               # Your secret keys (never commit this!)
├── .env.example       # Template for the above
└── public/
    └── index.html     # The fundraiser frontend
```
