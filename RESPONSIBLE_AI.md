# Responsible AI

| Risk | Mitigation in this project |
|------|----------------------------|
| **Privacy leaks** | Emails, phone numbers and long ID/card numbers are masked server-side before any provider call (on by default; user can toggle). Nothing is stored; there is no database or logging of content. |
| **Prompt injection** | User text is wrapped in tags and declared as data; system prompts instruct the model to ignore embedded instructions; free-text fields never control system behaviour (enums are allow-listed). |
| **Hallucination** | Prompts forbid inventing facts, quotes, links and citations; research output includes confidence levels, an uncertainty section and verification steps. |
| **Over-reliance** | UI shows "AI-generated content can contain mistakes. Review before you send or act." Outputs are drafts the user edits; nothing is sent automatically. |
| **Abuse / cost** | 12,000-character input cap, per-IP rate limit, output token cap, safe-refusal rule in every prompt. |
| **Bias and tone** | Prompts require neutral, professional language and prohibit discriminatory or deceptive content. |
| **Secrets** | API keys live only in environment variables on the server; `.env` is git-ignored; the browser never sees a key. |
| **Transparency** | Badge shows live vs demo mode and which provider generated the result; the ethics dialog explains the rules in plain language. |

## Limits we are upfront about

- Pattern-based masking does not catch names or street addresses.
- The assistant cannot verify facts or browse the web.
- In-memory rate limiting resets on cold starts.
- Users must follow their organisation's data policy before pasting work content.

## Before using at work

Check your employer's AI policy, avoid confidential or regulated data, review every output, and keep a human accountable for anything that is sent or decided.
