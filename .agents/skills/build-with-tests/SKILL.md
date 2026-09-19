---
name: build-with-tests
description: Use when implementing or extending AdMe features, fixing bugs, or changing behavior in code.
---

# Build With Tests

## Required Context

Read before editing: `CLAUDE.md`, `AGENTS.md`, `ARCHITECTURE.md`, `docs/AI_COUNCIL_ARCHITECTURE_AND_IMPLEMENTATION_SPEC.md`, relevant decisions under `docs/decisions/`, the approved story/brief when available.

## Process

1. Map 2–3 similar existing features and reuse their patterns.
2. Keep the change scoped to the approved module and role boundary (Consumer vs. Merchant/Advertiser vs. Admin).
3. Write or update tests near the changed behavior.
4. Preserve data-isolation, access-control (RLS), audit, and any other security-relevant boundaries already established in the codebase.
5. Update `README.md`, `CHANGELOG.md`, `ACTIVITY_LOG.md`, and relevant docs for meaningful changes.
6. Run targeted tests first, then the full test suite (`npm run test`), lint (`npm run lint`), and build (`npm run build`) before handoff.

## Rules

- No new dependencies without explicit approval and an ADR for unusual choices.
- Do not refactor unrelated code.
- Do not edit already-merged migrations unless the task explicitly requires a corrective migration.
- Never expose raw provider payloads, secrets, payment details, sensitive personal data, or database errors.
- If verification fails, report the exact command and failure — do not claim completion.
