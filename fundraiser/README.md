# UL Industrial Design Donation Fundraiser

A real fundraiser page with Stripe payments and a Neon persistent database.

---

## Setup

### 1. Get your Stripe keys
1. Go to [stripe.com](https://stripe.com) → **Developers → API Keys**
2. Copy your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)

---

### 2. Get your Neon connection string
1. Go to [neon.tech](https://neon.tech) → your project → **Dashboard**
2. Under **Connection Details**, copy the full **Connection string**
   It looks like: `postgresql://user:password@ep-something.neon.tech/neondb`

---

### 3. Configure your environment

```bash
cp .env.example .env
```

Open `.env` and fill in:
```
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...your neon connection string...
FRONTEND_URL=http://localhost:3001
```

Also open `public/index.html`, find this line and replace with your publishable key:
```js
const stripe = Stripe('pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY');
```

---

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

---

### 5. Test a donation

| Card Number           | Result  |
|-----------------------|---------|
| 4242 4242 4242 4242   | Success |
| 4000 0000 0000 9995   | Decline |

Use any future expiry (e.g. `12/34`) and any 3-digit CVV.

---

### 6. Deploy to Render

1. Push this folder to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service** → connect repo
3. Set **Root Directory** to `fundraiser` if needed
4. Build command: `npm install` | Start command: `npm start`
5. Add environment variables:
   - `STRIPE_SECRET_KEY`
   - `DATABASE_URL`  ← your Neon connection string
   - `FRONTEND_URL`  ← your domain e.g. `https://yourdomain.com`
6. Deploy!

---

### 7. Connect your Squarespace domain
1. Render → Settings → Custom Domains → add your domain
2. Squarespace → Domains → DNS Settings → Custom Records → add:
   - Type: `CNAME` | Host: `www` | Value: your Render URL
   - Type: `A` | Host: `@` | Value: `216.24.57.1`

---

## Project structure

```
fundraiser/
├── server.js           # Express backend — Stripe + Neon DB
├── package.json
├── .env                # Your secret keys (never commit this!)
├── .env.example        # Template
└── public/
    └── index.html      # The fundraiser frontend
```
