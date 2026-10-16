'use strict';

const MAX_CHARS = 12000;

/** Masks common personal identifiers before text leaves the server. */
function redactPII(text) {
  return String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[CARD/ID NUMBER]')
    .replace(/(?<!\w)\+?\d[\d\s().-]{8,}\d(?!\w)/g, '[PHONE]');
}

function redactDeep(value) {
  if (typeof value === 'string') return redactPII(value);
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactDeep(v)]));
  }
  return value;
}

function totalLength(value) {
  if (typeof value === 'string') return value.length;
  if (Array.isArray(value)) return value.reduce((n, v) => n + totalLength(v), 0);
  if (value && typeof value === 'object') return Object.values(value).reduce((n, v) => n + totalLength(v), 0);
  return 0;
}

/** Best-effort in-memory limiter (resets on cold start). Use Upstash/Vercel KV for production. */
const hits = new Map();
function rateLimit(key, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const entry = (hits.get(key) || []).filter((t) => now - t < windowMs);
  entry.push(now);
  hits.set(key, entry);
  if (hits.size > 5000) hits.clear();
  return entry.length <= limit;
}

module.exports = { MAX_CHARS, redactPII, redactDeep, totalLength, rateLimit };
