# new-eazy

Monorepo for the new-eazy food-ordering project.

This repository contains two main folders:

- `backend/` - Node.js + Express API (MongoDB, Stripe integration)
- `frontend/` - React + Vite SPA (Tailwind CSS, Sonner toasts, Socket.io client)

---

## Prerequisites

- Node.js (recommended v18+)
- npm (or pnpm/yarn)
- MongoDB instance (Atlas or local)
- (Optional) Cloudinary account for image uploads
- (Optional) Stripe account for payments

---

## Backend - Setup & Run

1. Navigate to backend folder:

```powershell
cd backend
```

2. Install dependencies:

```powershell
npm install
```

3. Create a `.env` file in `backend/` with required environment variables. Example:

```
PORT=4000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=some_secure_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

4. Run in development (auto-restarts using `nodemon`):

```powershell
npm run dev
```

Or run the production start:

```powershell
npm start
```

Notes:
- The backend's `package.json` provides `dev` (nodemon) and `start` (node) scripts.
- If you use Stripe webhooks for payment confirmation, make sure your webhook endpoint is reachable (use `ngrok` or similar during local development) and configure `STRIPE_WEBHOOK_SECRET` accordingly.

---

## Frontend - Setup & Run

1. Navigate to frontend folder:

```powershell
cd frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Run the dev server:

```powershell
npm run dev
```

4. Build for production:

```powershell
npm run build
```

Notes:
- The frontend uses Vite. Default dev server commonly runs on `http://localhost:5173`.
- Tailwind CSS is used for styling; ensure PostCSS/tailwind are set up if adding custom builds.

---

## Testing / Linting

- Frontend linter:

```powershell
cd frontend
npm run lint
```

- Backend: there are no automated tests configured yet.

---

## Project Structure (top-level)

```
backend/
  package.json
  src/
    server.js
    routes/
    models/
    config/
    middleware/
frontend/
  package.json
  src/
    pages/
    components/
    api/
```

---

## Useful Notes

- If your environment's static linter doesn't process Tailwind/PostCSS, you may see warnings about `@apply` or `@tailwind` at-rules. These are expected unless the linter is integrated with PostCSS/Tailwind.
- To test Stripe webhooks locally, use `ngrok` and configure `STRIPE_WEBHOOK_SECRET`.
- Socket.io is used to push realtime updates (orders) from the backend. Ensure CORS and client URL are configured correctly in the backend `.env` / config.

---

