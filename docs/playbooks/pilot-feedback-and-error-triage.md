# Pilot Feedback & Error-Triage System — Implementation, Usage, and Integration Playbook

A low-friction, in-product feedback and automatic-error-capture loop for pilot/demo users, with server-side deduplication, rate limiting, and a staff triage workspace. This is the single highest-leverage tool for the MVP → full-product journey: it turns raw pilot usage into structured, prioritized signal without asking pilot users to file tickets, and it is the concrete mechanism for closing an "external validation" gate (a real user completing real usage, uncoached) that no amount of internal audit can substitute for.

This playbook is written to be portable to any codebase, any stack. Adapt naming, database, and framework specifics; keep the architecture, the data-boundary rules, and the operational discipline.

---

## 0. Why this exists

Pilot and demo users rarely file good bug reports. They hit something confusing or broken, shrug, and move on — and you never hear about it. This system closes that gap two ways:

1. **Manual capture** — a floating, always-available feedback button lets a user flag a bug, error, unexpected result, or improvement idea in under 10 seconds, in context, without leaving the page.
2. **Automatic capture** — a global error boundary silently reports unhandled UI errors the moment they happen, with the same context a manual report would carry, so you learn about crashes even when the user never says a word.

Both funnel into one deduplicated, triageable queue that staff review — turning "a pilot church/customer is using this uncoached" from a hope into an instrumented, observable process. Treat this system itself as a Phase-A/pilot-gate requirement, not a nice-to-have: if you can't see what real users are hitting, you can't credibly claim the pilot validated anything.

---

## 1. Architecture at a glance

```
┌─────────────────────────────────────────────────────────────────┐
│ Client (only in demo/pilot mode — feature-gated, server-enforced)│
│                                                                   │
│  SessionProvider ──▶ session UUID, breadcrumbs (last 5 routes),  │
│                       elapsed session duration, SSR-safe          │
│         │                                                        │
│         ├──▶ FeedbackButton (manual) ──▶ modal: category + note  │
│         │                                                        │
│         └──▶ ErrorBoundary (automatic) ──▶ silent capture on     │
│               unhandled render error, non-blocking toast          │
│                                                                   │
│         both POST only contextual, untrusted data ───────────────┼──┐
└─────────────────────────────────────────────────────────────────┘  │
                                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Server: one submission endpoint                                     │
│  1. re-check the feature gate server-side (never trust the client)  │
│  2. validate/bound every field; reject malformed input               │
│  3. derive identity from the authenticated session — ignore any      │
│     identity the client claims to be                                 │
│  4. compute a normalized SHA-256 fingerprint server-side — ignore     │
│     any fingerprint the client claims                                │
│  5. atomic distributed rate limit (N submissions per session per     │
│     window) — in shared durable storage, not process memory          │
│  6. upsert on fingerprint: increment hit count, refresh context,      │
│     reopen if previously triaged, keep original created_at            │
└─────────────────────────────────────────────────────────────────────┘
                                                                       │
                                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Storage: one table, isolated from tenant/customer operational data   │
│  RLS/equivalent: only platform staff can read or mutate; the public   │
│  submission path writes only through a server-only privileged client  │
└─────────────────────────────────────────────────────────────────────┘
                                                                       │
                                                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Staff triage workspace (platform-staff-only route)                    │
│  filter → open row → set action → mark processed → optimistic update  │
└─────────────────────────────────────────────────────────────────────┘
```

Three non-negotiable boundary rules, regardless of stack:
- **The feature gate is enforced on the server, not just hidden client-side.** A disabled feature flag that only hides a button is not a gate — the endpoint itself must refuse writes.
- **Identity and fingerprint are always server-derived, never client-supplied.** The browser is not a trusted source for "who is this" or "is this a duplicate."
- **Feedback storage lives in the platform/control-plane data boundary, not customer/tenant operational storage**, if your system has that split. It's operational telemetry about your product, not a customer's data.

---

## 2. How to implement it

### 2.1 Feature gate
- One environment variable, checked in the client (to render nothing) *and independently re-checked server-side in the submission endpoint* (to reject writes even if someone bypasses the client). When disabled: the button renders nothing, the session provider adds no listeners/storage writes, the error boundary reports nothing, the endpoint returns a non-success response.

### 2.2 Client session context
A single provider, mounted once at the application root, that:
- generates a random UUID and persists it in `sessionStorage` (survives navigation within a tab, not across tabs/browsers — this is a session identifier, not a durable identity),
- tracks session start time and the last 5 routes visited (breadcrumbs),
- exposes session ID, breadcrumbs, and elapsed duration to children,
- renders safely under server-side rendering with no hydration mismatch.

### 2.3 Manual feedback capture
A fixed-position, accessible button available on every page while the gate is on. Opens a small form:
- required category (small fixed enum — e.g. `BUG`, `ERROR`, `UNEXPECTED_RESULT`, `IMPROVEMENT`),
- optional free-text note, hard-capped length,
- loading/success/failure states.

The browser submits only: session ID, current route, category, optional note, breadcrumbs, app/build version, session duration. It never submits — and the server never trusts — identity, authorization, or a client-computed fingerprint.

### 2.4 Automatic error capture
A framework-appropriate global error boundary (a class component in React; the closest equivalent elsewhere) that, on an unhandled render error while the gate is on:
- fires a non-blocking submission with category `ERROR`, the safe error message, route, breadcrumbs, version, and session duration,
- swallows failures from that reporting call itself (reporting must never cause a second crash),
- shows a brief non-blocking notification that the error was captured,
- never includes stack traces, secrets, request headers, tokens, or raw sensitive records.

### 2.5 Server submission contract
One endpoint. On every request:
1. **Re-check the gate.** Reject if disabled, independent of any client state.
2. **Validate and bound everything**: session ID as a real UUID; route length-capped; category against an exact allowlist; error message and note length-capped; breadcrumbs capped to a small array of capped-length strings; version capped; duration bounded to a sane maximum (e.g. 30 days in seconds). Reject malformed JSON and wrong types outright. Return a generic failure message on any internal error — never leak internals to the client.
3. **Derive identity server-side.** If authenticated, store only what staff actually need for triage (e.g. email + role) — resolved from the server session, never from a client-supplied field. Anonymous submissions store null identity.
4. **Compute the fingerprint server-side.** Normalize inputs (trim, lowercase, collapse whitespace) and hash: for automatic errors, `route + category + error message`; for manual reports, `route + category + note`. This is what makes "the same bug reported by 40 pilot users" collapse into one row with a rising hit-count instead of 40 rows — the single most useful property of this system for prioritization. Ignore any client-provided fingerprint entirely.
5. **Rate-limit atomically, in shared storage.** A per-session cap over a short rolling window (e.g. 20/minute), enforced in the database or a distributed rate-limiter — never in server process memory, which doesn't survive restarts or work across multiple server instances. If your database supports it, do this in one atomic transaction/function rather than a read-then-write from application code, to avoid a race under concurrent requests. Exceeding the limit returns a distinct, recognizable status (e.g. HTTP 429) so you can prove the limiter actually works, not just that it exists.
6. **Upsert on fingerprint conflict**: increment hit count, refresh the latest context fields, keep the original creation timestamp, reopen it (clear "processed"/"resolved" state and any prior triage action) so a regression that resurfaces after being marked fixed comes back to staff's attention automatically.

### 2.6 Data model
One table (or extension of an existing equivalent), isolated from customer/tenant operational data if that split exists in your system:
- primary key; unique fingerprint; session ID; route; constrained category; optional error message; optional note; structured breadcrumbs; optional user email/role; app version; nullable non-negative session duration; hit count (default 1); structured metadata; a `processed` boolean (default false); a nullable constrained triage-action field; created/updated timestamps.
- A small fixed set of triage actions covering "fixed in code," "no action needed," "acknowledged, not yet implemented," "implemented," and "received and closed" — whatever taxonomy matches your team's actual workflow.
- Access control: only platform/staff roles can read or write triage fields; the public submission path never writes directly — it goes through a server-only privileged client/function, scoped as narrowly as your database's privilege model allows (e.g., invoker rights over definer rights when the calling role already has the needed table privileges, execute permission granted only to the server role).
- Index on route, category, session ID, and creation time (descending) — this is a triage queue that gets sorted and filtered constantly.

### 2.7 Staff triage workspace
A protected, staff-only page:
- open / done / all views, with unprocessed-first-then-newest as the default sort,
- filters: category, user email/role substring, date range,
- list view: timestamp, identity if known, route, category badge, note/error preview, hit count, current action, processed toggle,
- a detail drawer per row: full note/error, breadcrumbs, session duration, hit count, an action selector, a processed toggle, and a collapsed raw-JSON view for deeper diagnosis,
- optimistic UI updates on triage actions, rolled back locally if the server update fails,
- both the page and its mutation endpoint protected by your platform-staff authorization check — not just hidden from nav.

### 2.8 Required tests
Prove, don't assume:
1. every client-side piece is fully inert when the gate is off (no render, no listeners, no storage writes, no network calls),
2. the server rejects submissions when the gate is off, independent of client state,
3. manual submission carries the expected context,
4. automatic error capture submits context and swallows its own reporting failures,
5. client-supplied identity and fingerprint fields are ignored, not merely unused,
6. authenticated identity is correctly derived server-side; anonymous submissions store none,
7. equivalent normalized reports collapse to one fingerprint; materially different manual notes on the same route/category do not,
8. every field's validation bound and the category allowlist are enforced,
9. exceeding the rate limit returns the distinct rate-limited status; a real database/storage error returns a generic failure, not raw internals,
10. only staff can load or mutate triage records — assert this from an unauthenticated *and* an authenticated-but-wrong-role caller, not just the happy path,
11. the triage workspace's filters, empty state, detail drawer, and both update actions work,
12. a duplicate submission increments hit count and reopens a previously-processed record.

---

## 3. How to use it (operational playbook)

Building this system is not the point — running it is. A feedback queue nobody looks at is worse than not having one, because it creates the appearance of a safety net that isn't there.

**Cadence.** During an active pilot, check the triage queue at least daily — ideally, whenever you know a pilot user has been actively using the product. During quieter periods, a fixed weekly slot is the floor; don't let it slide to "whenever I remember."

**Triage discipline, per item:**
- Read hit count first. A single report might be noise or user confusion; a rising hit count across sessions is a real, reproducible problem — prioritize by hit count, not just recency.
- `ERROR` category items (automatic capture) are your crash/regression signal — treat a new one as higher priority than a `BUG` you already knew about, because it means something broke that nobody was watching for.
- `IMPROVEMENT` items are roadmap input, not bugs — route them to product planning (feed them into your idea/story-writing stage, e.g. as raw material for a `story-writer`-style agent or your own backlog grooming), not your bug tracker.
- Set the triage action honestly. "Acknowledged, not yet implemented" is a legitimate, useful state — don't mark something "fixed" to clear the queue when it isn't.
- When you do fix something, don't just close the ticket in your own tracker — mark the corresponding feedback row's action so the loop is visibly closed to whoever reviews this queue next.

**Connect it to the rest of your development discipline, don't let it be an island:**
- A cluster of related feedback items is a legitimate trigger for a `feature-factory`-style idea → story → spec cycle, same as a stakeholder request would be.
- If you run a periodic full-system audit (a "Council" style review), feed this queue's patterns into the feature/competitive-gap audit — real user friction is stronger evidence than an agent's read of the code.
- If your MVP-to-product roadmap has an explicit "needs real-world/uncoached validation" gate, this system is how you produce the evidence for it — a pilot user's session with zero feedback submissions and zero automatic errors over a full real usage session is meaningfully different from "we assume it went fine."

**Metrics worth watching over time**, even informally:
- Submission volume per pilot session (near-zero after the first week can mean either "it's solid" or "they stopped trying it" — check which).
- Ratio of `ERROR` to `BUG`/`UNEXPECTED_RESULT`/`IMPROVEMENT` — a rising `ERROR` share means something in recent changes destabilized the product.
- Time from submission to triage action — a queue that grows faster than it's reviewed is a process failure independent of the underlying bugs.
- Hit-count distribution — a small number of very-high-hit-count rows tells you exactly where to spend limited pilot-hardening time next.

**When to turn it off, and when not to.** The feature gate exists so this can be pilot/demo-only without extra risk to your production customer base. Decide explicitly whether it stays pilot-only forever, gets promoted to always-on for every customer (a real in-product feedback channel), or gets replaced by a support-ticketing integration once you're past the pilot stage — don't let "it was for the demo" become an accidental permanent decision by default.

---

## 4. How to bake it into the software (integration checklist)

- **Mount point.** Wire the session provider and error boundary at the absolute root of your application shell/root layout, wrapping every route — not per-page. The feedback button similarly renders once, globally, not duplicated per page.
- **Environment variable.** One clearly-named flag (e.g. `PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE`), set explicitly per environment. Document, in your environment-variable reference, that this flag alone is *not* the security boundary — the server-side re-check in the endpoint is.
- **Migration/deployment order.** Ship the database migration (table + access-control policies + any privileged submission function) before or in the same deploy as the endpoint that depends on it — never after. If your database supports rolling/zero-downtime deploys, make sure an in-flight old server version calling an old function signature doesn't break when the new migration lands; version or keep the old function callable through the deploy window if needed.
- **Data-plane placement.** If your system has a control-plane/platform vs. tenant/customer data split, this table belongs on the platform side. If it doesn't have that split, it still belongs in a schema/area scoped to staff-only access, separate from customer-facing tables.
- **Access-control wiring.** Enable row-level security (or your database's closest equivalent) on the table from the same migration that creates it — never as a follow-up. Grant the public submission path only through a server-only privileged client/function, not direct table access from any client-facing role.
- **CI verification, not just code review.** Add (or extend) an automated check that proves the access-control policy actually exists and is enabled for this table — the same "a check that looks like a safeguard but has an unmet precondition is worse than no check" discipline that should apply to any security-relevant gate in your pipeline. If you already run a data-isolation/RLS audit in CI, this table must appear in its coverage, not be quietly exempt.
- **Kill switch.** The environment variable doubles as your kill switch — confirm you can flip it off in a live environment without a deploy (a runtime config value, not a build-time constant baked into a static bundle) if that matters for your incident-response posture.
- **Don't let it silently rot.** Treat "is anyone actually checking this queue" as a periodic health question, the same way you'd periodically verify a CI gate hasn't quietly become a no-op — a feedback system nobody reads is a false sense of security, not a safety net.

---

## 5. Appendix: ready-to-paste implementation prompt

Paste the following into a coding agent inside the target repository to build this from scratch, adapted to that repo's actual stack.

```
You are working in an existing software repository. Implement a complete,
production-quality pilot/demo feedback and error-triage system equivalent to
the architecture below. Adapt it to the repository's existing framework,
database, authentication, component library, testing tools, and documentation
conventions. Do not introduce a parallel architecture when established
patterns already exist.

Required working method:
1. Read the repository's agent instructions, architecture docs, development
   plan, dependency manifest, authentication implementation, database
   migration conventions, and test configuration before proposing changes.
2. Locate existing patterns for: global application providers and error
   boundaries; authenticated server routes; privileged database access;
   row-level security or equivalent authorization; staff/admin workspaces;
   notifications/toasts; migrations; and focused tests.
3. Present a concise design covering architecture, data flow, privacy,
   access control, deduplication, rate limiting, error handling, and tests.
   Get approval if the repo's workflow requires it.
4. Use test-driven development: add failing tests, verify they fail for the
   right reason, implement the smallest coherent behavior, rerun.
5. Update the repository's README, changelog, relevant operational docs, and
   implementation/handoff notes.
6. Run focused tests plus the repository's standard lint and production-build
   commands. Report exact results and residual risks.

Functional scope: feature-gated (server-enforced, not just client-hidden)
demo/pilot mode; a global session context (random session UUID in
sessionStorage, last-5-route breadcrumbs, elapsed duration, SSR-safe); a
fixed-position accessible feedback button with a category enum (BUG, ERROR,
UNEXPECTED_RESULT, IMPROVEMENT) and a capped-length optional note; a global
error boundary that silently reports unhandled render errors with the same
context, swallowing its own reporting failures; one server submission
endpoint that re-checks the gate, validates and bounds every field, derives
identity server-side from the authenticated session (ignoring any
client-supplied identity), computes a normalized SHA-256 fingerprint
server-side (ignoring any client-supplied fingerprint) to deduplicate
equivalent reports while keeping materially different manual notes separate,
and enforces an atomic distributed per-session rate limit (e.g. 20/minute) in
shared durable storage, not process memory; a data model isolated from
customer/tenant operational storage (if that split exists) with row-level
security or equivalent restricting reads/writes to platform staff only, a
hit-count that increments and reopens processed records on fingerprint
conflict, and a small fixed triage-action taxonomy; and a protected
staff-only triage workspace with open/done/all views, category/identity/date
filters, unprocessed-first sorting, a detail drawer, and optimistic
triage-action/processed updates protected by the repo's platform-staff
authorization check on both the page and its mutation endpoint.

Required tests: gate fully inert client-side and server-side when disabled;
manual and automatic submission context correctness; client-supplied
identity/fingerprint ignored; server-derived identity correct for
authenticated and anonymous cases; fingerprint deduplication and
non-deduplication cases; field/category validation bounds; rate-limit
rejection status distinct from generic-error status; staff-only access to
triage read/write, asserted from unauthenticated and wrong-role callers;
triage workspace filter/detail/update behavior; duplicate-submission
hit-count increment and reopening.

Delivery requirements: no unusual dependencies without approval and an ADR;
preserve unrelated working-tree changes; use a feature branch, never push
directly to the default branch; include migration deployment order and
required environment variables in the handoff; report files changed,
behavior added, verification commands/results, and residual risks; call out
explicitly that a browser-generated session ID can be rotated by the user and
that per-session rate limiting is not complete bot/abuse protection.
```
