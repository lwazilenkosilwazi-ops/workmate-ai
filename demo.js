'use strict';

/** Offline responses so the app works (and can be demoed) without any API key. */
const clip = (s, n = 160) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n).replace(/[.\s]+$/, '');

function demo(task, input = {}) {
  const note = '\n\n> Demo mode: no API key is configured, so this is a template response. Add a key in your Vercel project settings (Environment Variables) for real AI output.';
  switch (task) {
    case 'email':
      return `**Subject:** ${clip(input.purpose, 40) || 'Quick follow-up'}\n\nHi ${input.recipient || '[Recipient]'},\n\nI'm writing regarding the following: ${clip(input.purpose)}.\n\nCould you let me know by end of week how you'd like to proceed? Happy to jump on a short call if that's easier.\n\nBest regards,\n[Your name]\n\n---\n*Alternative subject lines:* Following up | Action needed this week${note}`;
    case 'summary':
      return `## Summary\n${clip(input.transcript, 220)}...\n\n## Key decisions\n- [Decision extracted from transcript]\n\n## Action items\n| # | Action | Owner | Due |\n|---|--------|-------|-----|\n| 1 | [Action item] | Unassigned | Not stated |\n\n## Open questions / risks\n- [Open question]\n\n## Suggested follow-up email subject\nRecap and next steps${note}`;
    case 'plan':
      return `## Goal\n${clip(input.goal)}\n\n## Milestones\n1. Define scope - Week 1\n2. Build first version - Week 2-3\n3. Review and launch - Week 4\n\n## Task plan\n| Priority | Task | Est. (h) | Depends on |\n|----------|------|----------|------------|\n| High | Clarify requirements | 2 | - |\n| High | Draft deliverable | 8 | 1 |\n| Med | Review with stakeholders | 3 | 2 |\n\n## Risks & mitigations\n- Scope creep -> agree scope in writing\n\n## Assumptions\n- Template only${note}`;
    case 'research':
      return `## Short answer\nThis is a placeholder answer for: "${clip(input.question)}".\n\n## Key points\n- Point one (confidence: medium)\n\n## What is uncertain or may be outdated\n- Anything time-sensitive\n\n## How to verify\n- Check official documentation and recent reputable publications\n\n## Follow-up questions worth asking\n- What decision will this inform?${note}`;
    default:
      return `Hi! I'm WorkMate. You said: "${clip(input.message)}".\n\nI can draft emails, summarise meetings, plan tasks and help with research.${note}`;
  }
}

module.exports = { demo };
