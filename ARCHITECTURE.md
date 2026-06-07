# Architecture & Design Specifications

This document defines the system topology, security boundaries, database structures, and analytical pipelines of the AdMe platform.

---

## 1. High-Level System Architecture

AdMe uses a hybrid Next.js 16 App Router frontend integrated with a hardened Supabase backend. Session security and route routing are managed by Next.js middleware combined with PostgreSQL Row-Level Security (RLS) policies.

```mermaid
graph TD
    subgraph Web Client [Next.js Client-Side Application]
        UI[User Interface / React Components]
        Contexts[UserContext & ToastContext]
        Hooks[useEngagementAnalytics Hooks]
    end

    subgraph Edge Layer [Next.js Route Controls]
        Middleware["middleware.ts (Route & Role Guard)"]
        API["API Handlers (/api/engagement/*, /api/checkout)"]
    end

    subgraph Database Layer [Supabase / PostgreSQL Services]
        Auth[Supabase Auth Service]
        DB[(PostgreSQL Database)]
        Realtime[Realtime Replication Channel]
    end

    UI --> Contexts
    Contexts --> Middleware
    Middleware --> Auth
    API --> DB
    UI --> API
    Contexts --> DB
    DB -.-> Realtime
    Realtime -.-> UI
```

---

## 2. Security & Ledger Point Controls

To prevent balance modification exploits from the browser, direct client updates to point balances are restricted.

*   **Balance Protection Trigger**: A database trigger blocks direct `UPDATE` operations on point columns.
*   **Security Definer RPCs**: Balance changes must be requested through secure remote procedure calls (RPC) executing with elevated execution context (`SECURITY DEFINER`).

```mermaid
sequenceDiagram
    autonumber
    actor Attacker as malicious developer
    actor Client as Authorized Consumer
    participant API as Supabase REST API
    participant Trigger as postgres_trigger (restrict_user_updates)
    participant RPC as SECURITY DEFINER RPC (add_reward_points)
    participant DB as public.users Table

    Note over Attacker, API: Exploit Attempt
    Attacker->>API: UPDATE users SET rewards_balance = 999999
    API->>Trigger: Execute update transaction
    Trigger-->>API: ROLLBACK (Direct balance updates prohibited)
    API-->>Attacker: 403 Forbidden / Error

    Note over Client, DB: Authorized Transaction Flow
    Client->>API: RPC add_reward_points(points, action)
    API->>RPC: Invoke function with system credentials
    RPC->>DB: UPDATE points column internally
    DB-->>RPC: Success
    RPC-->>Client: Updated balance returned
```

---

## 3. GDPR Cascade Erasure (Right-to-be-Forgotten)

AdMe stores zero personally identifiable information (PII) on consumers. However, to guarantee complete deletion under GDPR and CCPA rules, a single profile deletion triggers database and auth cascades.

```mermaid
graph TD
    Consumer[Consumer Browser UI] -->|1. Clicks Forget Me| DB_Profile[public.users Table]
    DB_Profile -->|2. Triggers delete cascade| DB_Trigger[on_user_deleted trigger]
    DB_Trigger -->|3. Erases Auth credentials| Auth_Users[auth.users Table]
    
    subgraph PostgreSQL Foreign Key Cascades [Cascading Purges]
        DB_Profile -->|Cascade| Engagements[public.engagements]
        DB_Profile -->|Cascade| Preferences[public.user_preferences]
        DB_Profile -->|Cascade| Coupons[public.coupons]
        DB_Profile -->|Cascade| Leads[public.leads]
        DB_Profile -->|Cascade| Reports[public.ad_reports]
    end
```

---

## 4. Sticky A/B Testing & Feed Pipeline

To ensure A/B test results are statistically valid, users must consistently see the same variation for a campaign throughout their sessions.

```mermaid
flowchart TD
    Init[Feed mounted / Tab switched] --> Fetch[Fetch ads from mock pool / DB]
    Fetch --> Filter[Filter ads matching user preferences]
    Filter --> Hashing{For each campaign variation}
    
    Hashing -->|Hash Device UID + Campaign ID| HashCalc["Index = ABS(Hash) % Variations.length"]
    HashCalc --> Select[Keep winning variation / discard others]
    Select --> Sort[Sort by boosted status & distance]
    Sort --> Render[Render first N ads to the viewport]
```

---

## 5. Cryptographic Viewport Heartbeat Sequence

To prevent dwell-time spoofing (where clients artificially pad viewing durations to farm points), dwell metrics are signed with HMAC hashes.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Web Browser / Viewport
    participant API_Init as API (/api/engagement/init)
    participant API_HB as API (/api/engagement/heartbeat)
    participant DB as public.engagements Table

    Client->>API_Init: POST { adId, userId, sessionStart }
    Note over API_Init: Generate HMAC signature using Private Key
    API_Init-->>Client: Return cryptotoken [HMAC(adId + userId + sessionStart)]

    Loop Every 5 Seconds in Viewport
        Client->>API_HB: POST { adId, userId, elapsed, cryptotoken }
        Note over API_HB: Verify cryptotoken signature using Private Key
        alt Signature Valid
            API_HB->>DB: Insert / Upsert engagement log
            API_HB-->>Client: 200 OK
        else Signature Invalid
            API_HB-->>Client: 400 Bad Request (Blocked)
        end
    end
```
