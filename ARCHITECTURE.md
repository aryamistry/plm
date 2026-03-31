# Architecture Overview

## Backend: Feature-based modules

Each domain (products, boms, ecos, approvals) is self-contained:
- `*.routes.js` — HTTP routing, auth/authorize/validate middleware
- `*.controller.js` — HTTP layer only, delegates to service
- `*.service.js` — All business logic, DB access via pg Pool

## Database: Versioned entity pattern

Products and BoMs use a parent + versions table pattern:
- `products` → `product_versions` (ACTIVE/ARCHIVED)
- `boms` → `bom_versions` (ACTIVE/ARCHIVED)

ECO proposed changes are stored in typed tables, not JSONB blobs.

## ECO Lifecycle

```
NEW → [propose changes] → submit → IN_PROGRESS → [approve/validate per stage] → DONE
                                                 → [any reject] → REJECTED
```

## Security

- **Passwords**: bcrypt (saltRounds: 12) with complexity requirements
- **Auth**: JWT access (15m) + refresh (7d, DB-stored, SHA-256 hashed)
- **API**: helmet (CSP), cors (origin whitelist), rate limiting (auth: 10/15min, api: 100/min)
- **Validation**: Zod on all request bodies/params/query
- **Public signup**: Operations role only — admin assigns roles via PATCH /api/users/:id/role

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js v20+ |
| Framework | Express.js v5 |
| Database | PostgreSQL (raw SQL via `pg`) |
| Auth | JWT (access + refresh) |
| Validation | Zod |
| Frontend | React 18 + Vite + Tailwind CSS v3 |
