# Mental Health App — Backend

## Tech Stack
- Node.js + TypeScript
- Express.js (REST API)
- MongoDB / Mongoose (database)
- JWT (authentication)
- bcryptjs (password hashing)
- Google Gemini AI (@google/genai)

## Setup
```bash
npm install
npm run dev       # Development with hot-reload (tsx)
npm run build     # Bundle to dist/server.cjs
npm start         # Run production build
```

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `GEMINI_API_KEY` — Google Gemini AI API key
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret key for JWT signing
- `APP_URL` — Backend URL

## Fallback Database
If MongoDB is not configured, the app uses `db_fallback.json` as a local file-based data store.
