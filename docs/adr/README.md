# Architecture Decision Records (ADRs)

This directory stores Architecture Decision Records (ADRs) for AdMe, maintaining alignment with our established multi-agent governance board.

## Continuity with Existing Decisions

AdMe's Architecture Council has previously ratified decisions stored in [`docs/decisions/`](../decisions/):
- `COUNCIL-2026-001.md` through `COUNCIL-2026-009.md`

All ADRs created going forward must follow the sequential numbering convention and schema specified in [`docs/AI_COUNCIL_ARCHITECTURE_AND_IMPLEMENTATION_SPEC.md`](../AI_COUNCIL_ARCHITECTURE_AND_IMPLEMENTATION_SPEC.md) and [`improve-software.md`](../../improve-software.md).

## When is an ADR Required?

Per `AGENTS.md` and `improve-software.md`, an ADR is required for:
1. Introducing any new dependency or external third-party SDK.
2. Any new architectural boundary or data isolation model (e.g. cross-role permissions, multi-tenancy rules).
3. Any changes to database schema access controls (RLS policies, `SECURITY DEFINER` RPCs).
4. New integration contracts or public API endpoint patterns.
5. Cryptographic and privacy-preserving primitives (HMAC dwell tokens, Zero-Knowledge preference structures).

## ADR Lifecycle

1. **Proposal**: Drafted during Council Deliberation or Council Audit Synthesis.
2. **Review**: Scrutinized across the 6 personas (The Architect, The Engineer, The Security Lead, The Product Owner, The QA Lead, The Data Engineer) or Council Agents 1–4.
3. **Ratification**: Requires majority approval (≥4/6 votes) with binding amendments.
4. **Commit**: Committed as `docs/adr/COUNCIL-YYYY-NNN.md` (or mirrored in `docs/decisions/`).
