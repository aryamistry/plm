# PLM ECO Backend

A production-grade Node.js/Express backend for a **Product Lifecycle Management (PLM) Engineering Change Order (ECO)** system. All changes to Products and Bills of Materials (BoMs) must flow through ECOs — no direct edits to master data are allowed.

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL (raw SQL via `pg`)
- **Auth**: JWT (access + refresh token pattern, DB-backed)
- **Validation**: Zod (with password complexity)
- **Password Hashing**: bcryptjs (saltRounds: 12)
- **Security**: helmet (CSP), cors, rate limiting, X-Request-ID tracing
- **Testing**: Jest + Supertest

---

## Quick Demo Walkthrough

Run the full ECO lifecycle in ~5 minutes:

```bash
# 1. Start the backend
npm run dev

# Default admin account (created by apply-schema.js):
# Email:    admin@plm.local
# Password: Admin123!

# Or: the first account you sign up becomes Admin automatically.
# All subsequent signups get Operations role.

# 2. Login with the default admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plm.local","password":"Admin123!"}'
# → Save the accessToken

# 5. Create a product
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"product_code":"PROD-001","name":"Wooden Table","sale_price":100,"cost_price":50}'
# → Note the product id

# 6. Create an ECO
curl -X POST http://localhost:3000/api/ecos \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Price Update v2","type":"PRODUCT","product_id":1,"version_update":true}'

# 7. Propose changes
curl -X POST http://localhost:3000/api/ecos/1/changes \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"new_sale_price":150,"new_cost_price":70}'

# 8. Submit ECO
curl -X POST http://localhost:3000/api/ecos/1/submit \
  -H "Authorization: Bearer <TOKEN>"

# 9. Approve (as approver role)
# 10. Verify: GET /api/products/1/versions → version 2 is ACTIVE
```

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
CREATE DATABASE PLM;
```

2. Apply schema and seed data:
```bash
node db/apply-schema.js
```

This creates all tables, indexes, constraints, and seeds 4 roles + 4 ECO stages.

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 64 chars) | — |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 64 chars) | — |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |

### 4. Run Dev Server

```bash
npm run dev
```

### 5. Run Tests

```bash
npm test
```

---

## Database ERD

```
┌──────────┐     ┌──────────────────┐     ┌────────────┐
│  roles   │←────│     users        │     │  products   │
└──────────┘     └──────────────────┘     └─────┬──────┘
                         │                       │
                         │              ┌────────┴────────┐
                         │              │product_versions  │
                         │              │(ACTIVE/ARCHIVED) │
                         │              └─────────────────┘
                         │
                         │         ┌──────────┐     ┌──────────────┐
                         │         │   boms   │────▶│ bom_versions │
                         │         └──────────┘     └──────┬───────┘
                         │                                 │
                         │              ┌──────────────────┴─────────────┐
                         │              │ bom_components │ bom_operations │
                         │              └────────────────┴───────────────┘
                         │
          ┌──────────────┴──────────────┐
          │           ecos              │
          │ (NEW/IN_PROGRESS/DONE/      │
          │  REJECTED)                  │
          └──────┬──────┬──────┬────────┘
                 │      │      │
    ┌────────────┤      │      ├────────────────────┐
    │eco_product │      │      │eco_bom_component   │
    │_changes    │      │      │_changes            │
    └────────────┘      │      └────────────────────┘
              ┌─────────┴────────┐
              │  eco_approvals   │     ┌─────────────────────┐
              │ (PENDING/        │     │eco_bom_operation     │
              │  APPROVED/       │     │_changes              │
              │  REJECTED)       │     └─────────────────────┘
              └──────────────────┘

  ┌────────────────┐  ┌───────────────┐
  │ refresh_tokens │  │  audit_logs   │
  └────────────────┘  └───────────────┘
```

---

## ECO Lifecycle Flow

```
┌─────────┐    Submit     ┌──────────────┐   All Approved    ┌──────┐
│   NEW   │ ────────────▶ │ IN_PROGRESS  │ ────────────────▶ │ DONE │
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

---

## API Endpoint Summary

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (operations role) |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Users (`/api/users`) — Admin only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user |
| PATCH | `/api/users/:id/role` | Change user role |
| DELETE | `/api/users/:id` | Delete user |

### Products (`/api/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product (with product_code) |
| GET | `/api/products` | List products (paginated, searchable) |
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
| `admin` | Full access. Manage users/roles, stages, view all data |
| `engineering` | Create/edit ECOs, propose changes, create products/BoMs |
| `approver` | View ECOs, approve/reject at approval stages |
| `operations` | Read-only: ACTIVE products, BoMs, DONE ECOs |

---

## Known Limitations

- **Attachment storage**: Attachments are stored as text URLs/notes, not binary files. A production deploy would use S3/GCS.
- **Email notifications**: No email when approvals are requested. Would integrate SendGrid/SES in production.
- **Audit log UI**: Audit logs exist in DB but no admin UI to browse them yet.
- **Concurrent ECOs**: Multiple ECOs for the same product can exist; applying one does not block others.

---

## License

ISC
