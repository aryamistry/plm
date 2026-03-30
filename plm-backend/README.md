# PLM ECO Backend

A production-grade Node.js/Express backend for a **Product Lifecycle Management (PLM) Engineering Change Order (ECO)** system. All changes to Products and Bills of Materials (BoMs) must flow through ECOs — no direct edits to master data are allowed.

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL (raw SQL via `pg`)
- **Auth**: JWT (access + refresh token pattern)
- **Validation**: Zod
- **Password Hashing**: bcryptjs (saltRounds: 12)
- **Testing**: Jest + Supertest

---

## Setup

### 1. Clone & Install

```bash
cd plm-backend
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE plm_db;
```

2. Run the schema:
```bash
psql -U your_user -d plm_db -f db/schema.sql
```

This creates all tables, indexes, and seeds the 4 roles (engineering, approver, operations, admin).

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 64 chars) | — |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 64 chars) | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds | `12` |

### 4. Run Dev Server

```bash
npm run dev
```

### 5. Run Tests

```bash
npm test
```

> Tests require a running PostgreSQL database. Point `DATABASE_URL` to a test database.

---

## ECO Lifecycle Flow

```
┌─────────┐    Submit     ┌──────────────┐   All Approved    ┌──────┐
│   NEW   │ ────────────> │ IN_PROGRESS  │ ────────────────> │ DONE │
│         │               │ (Approval    │                   │      │
│ Propose │               │  stages)     │                   │      │
│ Changes │               │              │                   │      │
└─────────┘               └──────┬───────┘                   └──────┘
                                 │
                           Rejected by
                           any approver
                                 │
                                 v
                          ┌──────────┐
                          │ REJECTED │
                          └──────────┘
```

1. **NEW**: ECO is created. Engineer proposes changes (product pricing or BoM components/operations).
2. **Submit**: ECO advances to the next stage. If the stage requires approval, pending approval records are created for all users with `approver` role.
3. **Approval**: Each approver can approve or reject. If ANY approver rejects, the entire ECO is rejected. If ALL approve, it advances to the next stage.
4. **Validate**: For stages that don't require approval, an admin/approver can validate to advance.
5. **DONE**: When the ECO reaches the final stage (or all stages pass), `applyECO` runs as a DB transaction:
   - `version_update=true`: Creates a new version and archives the old one
   - `version_update=false`: Updates data in-place (no new version)

---

## API Endpoint Summary

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Users (`/api/users`) — Admin only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Products (`/api/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product (v1) |
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Get product + all versions |
| GET | `/api/products/:id/versions` | Get version history |
| PATCH | `/api/products/:id` | Blocked — use ECO |
| PATCH | `/api/products/:id/archive` | Archive product (admin) |

### BoMs (`/api/boms`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/boms` | Create BoM with components/ops |
| GET | `/api/boms` | List BoMs (paginated) |
| GET | `/api/boms/:id` | Get BoM with active version |
| GET | `/api/boms/:id/versions` | Get all versions |
| GET | `/api/boms/:id/versions/:vId/diff` | Diff two versions |

### ECO Stages (`/api/eco-stages`) — Admin CRUD, all read
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/eco-stages` | Create stage |
| GET | `/api/eco-stages` | List all stages |
| PATCH | `/api/eco-stages/:id` | Update stage |
| DELETE | `/api/eco-stages/:id` | Delete stage |

### ECOs (`/api/ecos`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ecos` | Create ECO |
| GET | `/api/ecos` | List ECOs (paginated) |
| GET | `/api/ecos/:id` | Get full ECO details |
| POST | `/api/ecos/:id/changes` | Propose changes |
| GET | `/api/ecos/:id/diff` | View diff |
| POST | `/api/ecos/:id/submit` | Submit ECO |
| POST | `/api/ecos/:id/validate` | Validate (non-approval) stage |
| DELETE | `/api/ecos/:id` | Delete ECO (NEW only) |

### Approvals (`/api/approvals`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approvals` | Pending approvals |
| POST | `/api/approvals/:eco_id/approve` | Approve ECO |
| POST | `/api/approvals/:eco_id/reject` | Reject ECO |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/ecos` | ECO summary report |
| GET | `/api/reports/ecos/:id/changes` | ECO change details |
| GET | `/api/reports/product-version-history` | All product versions |
| GET | `/api/reports/bom-change-history` | All BoM versions |
| GET | `/api/reports/archived-products` | Archived products |
| GET | `/api/reports/active-matrix` | Active product–version–BoM matrix |

---

## Role Permissions

| Role | Access |
|------|--------|
| `admin` | Full access. Manage users, stages, view all data |
| `engineering` | Create/edit ECOs, propose changes, create products/BoMs |
| `approver` | View ECOs, approve/reject at approval stages |
| `operations` | Read-only: ACTIVE products, BoMs, DONE ECOs |

---

## License

ISC
