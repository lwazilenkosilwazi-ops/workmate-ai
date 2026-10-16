'use strict';

const { build } = require('./_lib/prompts');
const { generate } = require('./_lib/llm');
const { demo } = require('./_lib/demo');
const { MAX_CHARS, redactDeep, totalLength, rateLimit } = require('./_lib/safety');

const TEMPERATURE = { email: 0.6, summary: 0.2, plan: 0.4, research: 0.3, chat: 0.7 };

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid JSON body.' });

  const { task, history } = body;
  let { input } = body;
  if (!input || typeof input !== 'object') return res.status(400).json({ error: 'Missing input.' });
  if (totalLength([input, history]) > MAX_CHARS) {
    return res.status(413).json({ error: `Input too long (max ${MAX_CHARS} characters).` });
  }

  const redact = body.redact !== false; // privacy-first default
  const safeInput = redact ? redactDeep(input) : input;
  const safeHistory = redact ? redactDeep(history) : history;

  try {
    const { system, messages } = build(task, safeInput, safeHistory);
    const result = await generate({ system, messages, temperature: TEMPERATURE[task] });
    if (!result) return res.status(200).json({ output: demo(task, safeInput), demo: true, redacted: redact });
    return res.status(200).json({ output: result.text, provider: result.provider, model: result.model, redacted: redact });
  } catch (err) {
    const userError = /^(Unknown task|Please )/.test(err.message);
    if (!userError) console.error('assistant error:', err.message);
    return res.status(userError ? 400 : 502).json({
      error: userError ? err.message : 'The AI provider could not complete the request. Check your API key and try again.'
    });
  }
};
