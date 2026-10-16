'use strict';

function models() {
  return {
    gemini: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
  };
}

function detectProvider() {
  const forced = (process.env.LLM_PROVIDER || '').toLowerCase();
  const has = {
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY
  };
  if (has[forced]) return forced;
  return ['gemini', 'openai', 'anthropic'].find((p) => has[p]) || null;
}

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || data.message || `Provider returned HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

const providers = {
  async gemini({ system, messages, temperature }) {
    const model = models().gemini;
    const data = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: { temperature, maxOutputTokens: 2048 }
      }
    );
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    return { text: parts.map((p) => p.text || '').join(''), model };
  },

  async openai({ system, messages, temperature }) {
    const model = models().openai;
    const data = await postJson(
      'https://api.openai.com/v1/chat/completions',
      { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      { model, temperature, max_tokens: 2048, messages: [{ role: 'system', content: system }, ...messages] }
    );
    const msg = data.choices && data.choices[0] && data.choices[0].message;
    return { text: (msg && msg.content) || '', model };
  },

  async anthropic({ system, messages, temperature }) {
    const model = models().anthropic;
    const data = await postJson(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      { model, system, messages, temperature, max_tokens: 2048 }
    );
    return { text: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(''), model };
  }
};

async function generate({ system, messages, temperature = 0.5 }) {
  const provider = detectProvider();
  if (!provider) return null;
  const { text, model } = await providers[provider]({ system, messages, temperature });
  if (!text.trim()) throw new Error('The model returned an empty response. Please try again.');
  return { text, provider, model };
}

module.exports = { generate, detectProvider };
