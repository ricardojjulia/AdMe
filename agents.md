# Agent Instructions: Marketing and Ad Preferences Research

This document serves as a guide for the Gemini code builder and other agents working on the AdMe project. It outlines the research focus and implementation guidelines regarding user preferences for marketing and advertisements.

## Research Focus: How Users Prefer Their Marketing and Ads

### Objective
To build the AdMe platform with a deep understanding of user preferences, ensuring that ad delivery is effective yet respectful of the user experience.

### 1. Delivery Mechanisms
*   **Feed-based Ads:** transformative approaches to mixing ads with content.
*   **Non-Intrusive Formats:** Research formats that do not disrupt the user flow (e.g., native ads, sponsored content) versus those that do (pop-ups, interstitials).
*   **User Control:** Explore features that allow users to curate their ad experience (e.g., topic selection, frequency caps).

### 2. User Psychology & Engagement
*   **Value Exchange:** Investigate models where users feel they receive value (content, rewards, utility) in exchange for viewing ads.
*   **Trust & Privacy:** How transparency in data usage affects user willingness to engage with ads.
*   **Ad Blindness:** Strategies to overcome banner blindness without resorting to annoyance.

### 3. Implementation Principals for Gemini Code Builder
*   **UX First:** When generating UI/UX code, prioritize designs that minimize friction.
*   **Data-Driven:** Ensure the architecture supports A/B testing and detailed analytics to measure engagement with different ad types.
*   **Performance:** Ad loading should not degrade the application's performance.

### 4. Technical Requirements
*   Create flexible components that can easily switch between different ad rendering styles.
*   Implement robust logging for user interactions with ad elements (view time, clicks, dismissals).

## Directives
*   **Analyze** existing successful platforms (e.g., Instagram, TikTok, Pinterest) for their ad integration strategies.
*   **Propose** innovative ad formats that leverage the specific context of the AdMe application.
*   **Document** all findings and architectural decisions related to ad delivery.


---

# AdMe Agent Rules & Development Governance

- Read `ARCHITECTURE.md` and `docs/AI_COUNCIL_ARCHITECTURE_AND_IMPLEMENTATION_SPEC.md` before proposing or implementing changes. If no separate planning doc exists for a feature, those files plus `improve-software.md` are the source of truth.
- Keep the repo aligned with its documented directory structure. Do not add ad hoc top-level folders.
- Favor mainstream, well-supported dependencies. Write an ADR under `docs/adr/` (following the `docs/decisions/COUNCIL-YYYY-NNN.md` format) before introducing anything unusual.
- Update `README.md`, `CHANGELOG.md`, and relevant docs under `/docs` with every meaningful feature change.
- Document meaningful agent/factory runs transparently: intent, architecture impact, verification commands/results, residual risk, and follow-up work must be captured in committed docs or handoff notes — not only in chat.
- Verify work with `npm run lint`, `npm run test`, and `npm run build` before handoff when feasible.
- Do not push directly to `main`. Use a feature branch, push the branch, open a pull request, merge through GitHub after required checks and review, then pull the default branch.
- **The Council runs before every non-trivial merge to the default branch.** This is a mandate, not a suggestion — see `improve-software.md` §0 for scope and exceptions. AdMe uses a dual Council discipline:
  1. The 6-Persona Architecture Deliberation Board (The Architect, The Engineer, The Security Lead, The Product Owner, The QA Lead, The Data Engineer) for architectural and strategic proposals (see `docs/AI_COUNCIL_ARCHITECTURE_AND_IMPLEMENTATION_SPEC.md` and `scripts/run-council-deliberation.mjs`), which ratifies binding decisions into `docs/decisions/`.
  2. The 5-Agent Council Audit & Software Factory Protocol (4 read-only audit agents + Documenter) defined in `improve-software.md` for reviewing non-trivial branches before merge.
- **The `pr-review` gate runs before every merge, non-trivial or not** — in addition to, not instead of, the Council. `pr-reviewer` is read-only: it ranks findings Critical/Important/Minor and hands them back; it never merges, approves, or closes anything itself.
- Use repo-local skills under `.claude/skills/` and `.agents/skills/` as the software-factory workflow:
  - `council` — the Council review and Documenter close-out.
  - `feature-factory` — non-trivial feature planning and orchestration (idea → story → spec).
  - `build-with-tests` — implementation work.
  - `pr-review` — the mandatory pre-merge review gate.
  - `language-translation` — five-agent automated localization pipeline (integrated with AdMe's `@localization-governance` framework).
- **Security-first discipline (non-negotiable):**
  - Never expose secrets, credentials, PII, payment details, or raw database/stack-trace errors in responses, logs, error messages, or committed files.
  - Enforce authorization at the data layer wherever the stack supports it — PostgreSQL Row-Level Security (RLS) policies keyed on `user_id` / `owner_id` / `merchant_id` across all public tables — not only in application code. Application-layer-only authorization is a known regression path.
  - Run the automated data-isolation audit (`npm run audit:rls` / `node scripts/audit-data-isolation.mjs`) to verify RLS and policies on all tables.
  - Validate all external input at system boundaries. Never trust a client-supplied identifier for an authorization or accounting decision (e.g. dwell time must be HMAC-signed via `/api/engagement/heartbeat`; reward points can only be updated via `SECURITY DEFINER` RPCs).
- **Background Task & Process Hygiene (Mandatory):**
  - Never run unconstrained background commands or inline scripts that leave open network/database handles or open event loops.
  - All ad-hoc Node.js or bash scripts interacting with PostgreSQL, Redis, or external services MUST enforce explicit short timeouts (`connectionTimeoutMillis: 3000`, watchdog timers) and explicitly call `process.exit(0)` on completion or `process.exit(1)` on error. Use `npm run db:query` / `node scripts/db-query.mjs` for database inspection.
  - Never leave background tasks running when concluding a run, handoff, or user turn. Agents must execute a task audit (`manage_task` with action `'list'`) and terminate any non-daemon or orphan background tasks before reporting completion or relinquishing turns.
- **Documentation discipline:** README, CHANGELOG, and docs are updated in the same change that needs them, not deferred. `ACTIVITY_LOG.md` and roadmap-style docs are updated to match reality.
- **Testing discipline:**
  - *Creation:* new or changed behavior gets a test near the change, sized to the actual risk.
  - *Execution:* run targeted tests first, then the full test suite (`npm run test`), lint (`npm run lint`), and build (`npm run build`).
  - *Evolution:* `test-verifier` and `implementation-validator` check tests and implementation against the approved story/brief. A red result is a stop condition.

Update this file only through the same PR discipline it describes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
