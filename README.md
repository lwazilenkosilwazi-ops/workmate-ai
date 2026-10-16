# WorkMate AI

An AI-powered workplace assistant that automates everyday tasks:

| Tool | What it does |
|------|--------------|
| **Email writer** | Turns a short brief into a ready-to-send email (tone + length control, alternative subject lines) |
| **Meeting summary** | Converts a transcript into summary, decisions, action-item table (owner/due) and open questions |
| **Task planner** | Turns a goal into milestones, prioritised tasks with estimates, weekly schedule, risks and assumptions |
| **Research helper** | Short answer, key points with confidence levels, what is uncertain, how to verify (never invents citations) |
| **Chat** | General workplace assistant with in-session memory |

**Responsible by design:** personal-data masking, prompt-injection defences, no server-side storage, rate limiting, input limits, visible AI-content notice. See [docs/RESPONSIBLE_AI.md](docs/RESPONSIBLE_AI.md).
**Prompt engineering:** see [docs/PROMPT_ENGINEERING.md](docs/PROMPT_ENGINEERING.md).

## Architecture

```
Browser (public/)  ->  POST /api/assistant  ->  safety.js (limits, PII masking)
                                             ->  prompts.js (role/task/constraints/format)
                                             ->  llm.js (Gemini | OpenAI | Anthropic)
                                             ->  Markdown result
```

- **Frontend:** plain HTML/CSS/JS, no build step.
- **Backend:** Vercel serverless functions in `api/` (Node 18+, zero dependencies).
- **Provider-agnostic:** set one API key and it just works. No key = demo mode with template output.

## Run locally

```bash
cp .env.example .env      # add ONE key (e.g. GEMINI_API_KEY); optional
npm run dev               # http://localhost:3000
npm test                  # unit tests (Node's built-in runner)
```

## Deploy: GitHub -> Vercel

1. **Push to GitHub**
   ```bash
   git init && git add . && git commit -m "WorkMate AI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/workmate-ai.git
   git push -u origin main
   ```
2. **Import in Vercel:** vercel.com/new -> import the repo. Framework preset: **Other**. Leave build command and output directory empty. Click **Deploy**.
3. **Add your key:** Project -> Settings -> Environment Variables. Add one of `GEMINI_API_KEY`, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (optionally `LLM_PROVIDER`, `*_MODEL`). Apply to Production, Preview and Development, then **Redeploy**.
4. Open the URL. The badge in the sidebar shows **Live (provider)** when the key works, **Demo mode** otherwise.

Free key for testing: Google AI Studio (Gemini). Never commit keys; `.env` is git-ignored.

## Project structure

```
api/
  assistant.js        main endpoint (validation, redaction, rate limit)
  health.js           reports live/demo mode (no secrets)
  _lib/prompts.js     prompt library
  _lib/llm.js         provider adapters
  _lib/safety.js      PII masking, limits, rate limiter
  _lib/demo.js        offline template responses
public/               index.html, styles.css, app.js
tests/                unit tests
docs/                 prompt engineering + responsible AI notes
```

## Known limitations

- The research tool cannot browse the web; it explains what to verify rather than citing sources.
- Rate limiting is in-memory (best effort). For production use Vercel KV / Upstash.
- PII masking is pattern-based and will not catch names or addresses. Users should still avoid pasting confidential data.

## License

MIT
