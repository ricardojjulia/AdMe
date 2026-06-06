# Contributing to AdMe

Thank you for contributing to AdMe! This document outlines our repository workflows, formatting rules, database migration instructions, and coding standards to maintain code quality.

---

## 🌿 Git Workflow & Branching

We use a standard feature-branch workflow. All changes should be developed on a dedicated branch before being merged into the protected `main` branch.

### 1. Branch Naming Conventions
*   **Feature branches**: `feature/your-feature-name`
*   **Bug fixes**: `bugfix/issue-description`
*   **Documentation updates**: `docs/topic-name`
*   **Refactoring**: `refactor/component-name`

### 2. Commit Message Guidelines
We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:
*   `feat: ...` for a new user-facing capability.
*   `fix: ...` for a bug fix.
*   `docs: ...` for documentation modifications.
*   `style: ...` for changes that do not affect code logic (whitespace, formatting).
*   `refactor: ...` for code changes that neither fix a bug nor add a feature.
*   `test: ...` for adding or fixing tests.
*   `chore: ...` for build process, package dependencies, etc.

*Example:* `feat: add A/B test variations to campaign dashboard`

---

## 🎨 Frontend & Style Guidelines

### 1. Typography & Colors
*   We use HSL color tokens defined inside `src/app/globals.css`. Do not hardcode hex values.
*   Animations should be smooth and transition-based (e.g., utilize our built-in `.hover-lift` class).

### 2. Styling Rules
*   Use **Vanilla CSS Modules** (`*.module.css`) to ensure layout isolation.
*   Do not write inline styles unless computing dynamic run-time calculations (e.g., dynamic component percentages or colors).
*   Do not inject Tailwind CSS unless explicitly agreed upon.

### 3. React & TypeScript
*   Use functional components with explicit TypeScript interfaces for all props.
*   Strict typing is required. Avoid the `any` type.
*   Always clean up event listeners and subscriptions (e.g., unsubscribe from Supabase channels on component unmount).

---

## 🗄️ Database & Supabase Guidelines

Any schema changes must be documented using **Supabase Migrations**.

### 1. Schema Migration Workflow
1. Run local migrations using the CLI:
   ```bash
   supabase migration new add_your_change_description
   ```
2. Write your SQL code in the newly created file inside `supabase/migrations/`.
3. Apply migrations locally to verify:
   ```bash
   supabase db reset
   ```
4. Verify RLS (Row Level Security) is enabled on all tables:
   ```sql
   ALTER TABLE public.tablename ENABLE ROW LEVEL SECURITY;
   ```

---

## 🧪 Testing and Verification

Before requesting code review:
1. Run the local build command to catch any TypeScript compiler and React assembly errors:
   ```bash
   npm run build
   ```
2. Ensure there are no ESLint linting errors:
   ```bash
   npm run lint
   ```
