'use strict';
const { detectProvider } = require('./_lib/llm');

module.exports = function handler(req, res) {
  const provider = detectProvider();
  res.status(200).json({ ok: true, mode: provider ? 'live' : 'demo', provider });
};
