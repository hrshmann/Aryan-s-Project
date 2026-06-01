/**
 * Local development server — runs Express API on port 3000.
 * For full-stack local dev, run the frontend separately (see root package.json).
 */

import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Mental Health Care API] http://localhost:${PORT}`);
  console.log("Run the frontend with: npm run dev:frontend (from project root)");
});
