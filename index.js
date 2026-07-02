require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable. Set it before starting the server.');
  process.exit(1);
}

// Only allow requests from your deployed frontend(s).
// Add any other origins you use (e.g. localhost for testing) to this list.
const ALLOWED_ORIGINS = [
  'https://priyanshis30.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow tools like curl/postman (no origin) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json({ limit: '25mb' })); // generous limit for extracted PDF text

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ResearchLens backend is running' });
});

// Generic proxy to Groq's chat completions endpoint.
// The frontend sends { model, messages, temperature, max_tokens, ... }
// exactly like it would to Groq directly, but WITHOUT an api key.
// This server attaches the real key before forwarding.
app.post('/api/analyze', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens, response_format } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'messages field is required' });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: max_tokens ?? 4096,
        ...(response_format ? { response_format } : {})
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', data);
      return res.status(groqResponse.status).json({ error: data.error?.message || 'Groq API error' });
    }

    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`ResearchLens backend listening on port ${PORT}`);
});
