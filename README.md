# ResearchLens Backend

A tiny Express server that keeps your Groq API key secret and proxies requests
from your GitHub Pages frontend to Groq's API.

## 1. Test it locally (optional but recommended)

```bash
cd researchlens-backend
npm install
cp .env.example .env
# edit .env and paste your real Groq key into GROQ_API_KEY
npm start
```

Visit http://localhost:3000 — you should see `{"status":"ok", ...}`.

## 2. Push this folder to its own GitHub repo

Create a new repo (e.g. `ResearchLens-backend`) and push these files to it.
**Do not commit your `.env` file** — `.gitignore` already excludes it.

## 3. Deploy to Render (free tier)

1. Go to https://render.com and sign up / log in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect the `ResearchLens-backend` repo you just created.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY` = your real Groq key
6. Click **Create Web Service**. Render will build and deploy it, giving you
   a URL like `https://researchlens-backend.onrender.com`.

(Railway, Fly.io, or a Vercel serverless function work the same way if you
prefer one of those instead — the important part is: the key lives only in
that platform's environment variables, never in your frontend code.)

## 4. Update the CORS whitelist

In `index.js`, `ALLOWED_ORIGINS` already includes
`https://priyanshis30.github.io`. Add/remove origins there if needed, then
redeploy.

## 5. Update your frontend

In your GitHub Pages frontend code:

- **Remove** the "Groq API Key" input banner and the code that reads/stores
  a user-entered key.
- **Replace** any direct call to `https://api.groq.com/openai/v1/chat/completions`
  with a call to your new backend instead, e.g.:

```js
const response = await fetch('https://researchlens-backend.onrender.com/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a research gap analysis assistant...' },
      { role: 'user', content: extractedPdfText }
    ]
  })
});
const data = await response.json();
const aiText = data.choices[0].message.content;
```

No `Authorization` header and no key needed on the frontend — the backend
attaches it.

## Notes

- Render's free tier "sleeps" after inactivity, so the first request after a
  while can take ~30-50 seconds to wake up. That's normal for a free plan.
- Keep `max_tokens`/PDF text size reasonable — very large multi-PDF payloads
  can hit Groq's context limits.
