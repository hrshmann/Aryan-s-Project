# Deploy to Vercel (Frontend + Backend)

This project deploys as one Vercel app: the React frontend is static files, and the Express API runs as a serverless function at `/api/*`.

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster (required in production — Vercel’s filesystem does not persist `db_fallback.json`)
3. [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key (optional; chatbot uses local fallback without it)

## 1. Push code to GitHub

```bash
cd c:\Users\Lenovo\Desktop\project
git init
git add .
git commit -m "Prepare for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory:** leave as `.` (project root)
4. Vercel reads `vercel.json` automatically — do not override Build Command unless debugging

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Add these for **Production**, **Preview**, and **Development**:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/mentalhealth?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Long random string for auth tokens (e.g. 32+ characters) |
| `GEMINI_API_KEY` | No | Enables live AI chatbot; without it, mock responses are used |
| `NODE_ENV` | No | Set to `production` (Vercel usually sets this) |

### MongoDB Atlas setup (quick)

1. Create a free M0 cluster
2. Database Access → create a database user with password
3. Network Access → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) so Vercel can connect
4. Connect → Drivers → copy the connection string and replace `<password>`

## 4. Deploy

Click **Deploy**. After the build:

- App URL: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/...` (same origin as the frontend)

## 5. Local development (two terminals)

```bash
# Terminal 1 — API on port 3000
npm run dev:backend

# Terminal 2 — Frontend on port 5173 (proxies /api to backend)
npm run dev:frontend
```

Open http://localhost:5173

Copy env files for local use:

```bash
copy backend\backend_package\.env.example backend\backend_package\.env
```

Edit `backend\backend_package\.env` with your `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.

## Deploy with Vercel CLI (optional)

```bash
npm i -g vercel
cd c:\Users\Lenovo\Desktop\project
vercel login
vercel
# Follow prompts, then add env vars in the dashboard or:
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add GEMINI_API_KEY
vercel --prod
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 500 / login fails | Check `MONGODB_URI` and Atlas IP allowlist |
| Chatbot not using AI | Set `GEMINI_API_KEY` and redeploy |
| Build fails on install | Ensure Node 20+ in Vercel project settings |
| Data resets on Vercel | You must use MongoDB; file DB is dev-only |

## Default demo accounts (seeded in MongoDB on first use, or in local `db_fallback.json`)

- Admin: `admin@Mental Health Care.in` / `admin123`
- Therapist: `aditi.specialist@Mental Health Care.in` / `therapist123`

After first deploy with MongoDB, register new users or seed the database manually if needed.
