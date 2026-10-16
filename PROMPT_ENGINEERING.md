# Prompt engineering notes

All prompts live in `api/_lib/prompts.js`.

## Anatomy used in every prompt

1. **Role**: "You are WorkMate, an expert business-communications writer."
2. **Shared rules**: data-vs-instructions, no fabrication, no sensitive data, safe refusals.
3. **Task**: one sentence describing the job.
4. **Silent process**: reasoning steps the model performs but does not print (keeps output clean).
5. **Constraints**: tone, length, "only use the transcript", "estimates in hours", etc.
6. **Output format**: an exact Markdown skeleton, so the UI can render tables and headings reliably.

## Techniques

| Technique | Where | Why |
|-----------|-------|-----|
| Role prompting | all tasks | Sets expertise and voice |
| Structured output template | summary, plan, research | Predictable, scannable results; tables for action items |
| Delimiters (`<transcript>`, `<user_input>`) | all tasks | Separates untrusted data from instructions (injection defence) |
| Constraint prompting | all tasks | Word limits, "Unassigned" instead of guessing owners |
| Hidden reasoning ("do silently") | email, plan | Better drafts without verbose chain-of-thought |
| Calibrated uncertainty | research | Confidence labels and a "what may be outdated" section |
| Parameterised prompts | email, plan, research | Tone/length/depth are whitelisted enums, never free text |
| Temperature per task | assistant.js | summary 0.2 (faithful), plan 0.4, research 0.3, email 0.6, chat 0.7 |
| Conversation windowing | chat | Last 10 turns only, each capped at 4,000 chars |

## Iteration log (how the prompts were refined)

1. v1 meeting summary invented owners when none were stated -> added "If an owner or deadline is not stated write Unassigned / Not stated".
2. v1 research answers sounded certain about shaky claims -> added confidence labels and a mandatory uncertainty section.
3. v1 emails opened with generic pleasantries -> added a constraint banning filler unless tone is formal.
4. v1 accepted any tone string, which allowed instruction smuggling -> tone/length/depth are validated against allow-lists.

## Tools used during development

Drafting, testing and comparing prompts across ChatGPT, Gemini and Claude; Notion AI for turning meeting notes into the sample transcripts and documentation outline. The shipped app is provider-agnostic.

## How to test a prompt change

Run the same 5 inputs (normal, very short, very long, ambiguous, adversarial such as "ignore previous instructions...") before and after. Check: format held, nothing invented, injection ignored, tone matched.
