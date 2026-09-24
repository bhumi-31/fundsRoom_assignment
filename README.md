# FOUNDRY — Mini Operations ERP

> Full-stack Operations ERP covering **Inventory → Work Order → Stock Check → Internal Transfer → Customer Reservation** with real-time SSE updates, atomic database transactions, and neobrutalist UI.

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + TanStack Query |
| **Backend** | Node.js + Express + TypeScript (separate service) |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **Authentication** | JWT (access + refresh tokens), role-based middleware |
| **Validation** | Zod schemas (reused for OpenAPI auto-generation via `zod-to-openapi`) |
| **Testing** | Vitest + Supertest, coverage reporting |
| **Logging** | Pino structured logging with request-id on every log line |
| **Real-time** | Server-Sent Events (SSE) endpoint for live inventory updates |
| **Containerization** | Docker Compose (postgres + api + web) |

---

## Project Setup

### Prerequisites
- **Node.js** >= 20.x
- **PostgreSQL** 16+ (local install OR via Docker)
- **npm** >= 10.x

### 1. Clone & Install

```bash
git clone <repo-url>
cd fundsroom-assignment
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` at the project root:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|:---------|:------------|:--------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://foundry:foundry123@localhost:5432/foundry_db?schema=public` |
| `PORT` | API server port | `4000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret (min 16 chars) | (set in .env) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 16 chars) | (set in .env) |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | `http://localhost:4000/api/v1` |

Environment variables are validated at boot with Zod — the API will **fail fast** with a clear error if any required variable is missing.

---

## Database Setup

### Option A: Docker (recommended)

```bash
docker-compose up -d postgres
```

### Option B: Local PostgreSQL

Create a database named `foundry_db` with user `foundry` / password `foundry123`:

```sql
CREATE USER foundry WITH PASSWORD 'foundry123';
CREATE DATABASE foundry_db OWNER foundry;
```

### Run Migrations & Seed

```bash
# Generate Prisma client
npx prisma generate --schema=apps/api/prisma/schema.prisma

# Run database migrations
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Seed demo data (3 users, 3 locations, 3 items, initial stock)
npx prisma db seed --schema=apps/api/prisma/schema.prisma
```

---

## How to Run

### Option 1: Docker Compose (everything)

```bash
docker-compose up --build
```

### Option 2: Local development (separate terminals)

```bash
# Terminal 1 — Backend API
npm run dev:api

# Terminal 2 — Frontend Web
npm run dev:web
```

### Access Points

| Service | URL |
|:--------|:----|
| Frontend UI | http://localhost:3000 |
| Backend API | http://localhost:4000/api/v1 |
| Health Check | http://localhost:4000/api/v1/health |
| SSE Events | http://localhost:4000/api/v1/events |
| Prisma Studio (DB GUI) | Run `npm run db:studio` → http://localhost:5555 |

### Demo Login Credentials

| Role | Email | Password |
|:-----|:------|:---------|
| Admin | admin@foundry.com | Admin123! |
| Operations | ops@foundry.com | Ops123! |
| Sales | sales@foundry.com | Sales123! |

---

## How to Test

```bash
# Run all tests
cd apps/api
npm test

# Run tests with coverage report
npm run test:coverage
```

### Mandatory Tests Implemented

| # | Test | File |
|:--|:-----|:-----|
| 1 | Cannot reserve more than available inventory (includes concurrent scenario) | `tests/inventory-concurrency.test.ts` |
| 2 | Cannot transfer more than available inventory | `tests/transfers.test.ts` |
| 3 | Destination stock increases only after transfer RECEIVED, not on DISPATCHED | `tests/transfers.test.ts` |
| 4 | Same transfer cannot be RECEIVED twice | `tests/transfers.test.ts` |
| 5 | Unauthorized role (SALES) cannot create Work Orders (→ 403) | `tests/rbac.test.ts` |

---

## API Documentation

- **OpenAPI 3.0 Spec**: Auto-generated from Zod schemas at `apps/api/openapi.json`
- **Postman Collection**: `docs/postman_collection.json` — import into Postman for interactive testing

### API Routes

| Method | Endpoint | Auth | Roles | Description |
|:-------|:---------|:-----|:------|:------------|
| POST | `/api/v1/auth/register` | — | — | Register new user |
| POST | `/api/v1/auth/login` | — | — | Login, returns JWT tokens |
| GET | `/api/v1/auth/me` | JWT | Any | Get current user profile |
| GET | `/api/v1/health` | — | — | Health + DB readiness check |
| GET | `/api/v1/inventory/balances` | JWT | Any | List inventory balances |
| GET | `/api/v1/inventory/ledger` | JWT | Any | View stock ledger history |
| POST | `/api/v1/inventory/receipt` | JWT | ADMIN, OPS | Receive new stock |
| POST | `/api/v1/inventory/reserve` | JWT | ADMIN, OPS, SALES | Reserve stock (atomic) |
| GET | `/api/v1/work-orders` | JWT | ADMIN, OPS | List work orders with shortage |
| POST | `/api/v1/work-orders` | JWT | ADMIN | Create work order |
| PATCH | `/api/v1/work-orders/:id/status` | JWT | ADMIN, OPS | Update work order status |
| GET | `/api/v1/transfers` | JWT | ADMIN, OPS | List transfers |
| POST | `/api/v1/transfers` | JWT | ADMIN, OPS | Create transfer request |
| PATCH | `/api/v1/transfers/:id/status` | JWT | ADMIN, OPS | Dispatch or receive transfer |
| GET | `/api/v1/orders` | JWT | ADMIN, OPS, SALES | List customer orders |
| POST | `/api/v1/orders` | JWT | ADMIN, SALES | Create customer order (reserve) |
| PATCH | `/api/v1/orders/:id/status` | JWT | ADMIN, SALES | Cancel order (release stock) |
| GET | `/api/v1/events` | JWT | Any | SSE stream for live updates |

---

## Database Schema / ER Diagram

See full ER diagram: [`docs/ERD.md`](docs/ERD.md)

### Core Models

- **User** — id, email, passwordHash, role (ADMIN/OPS/SALES), assignedLocationId
- **Location** — id, name
- **Item** — id, sku, name, category
- **InventoryBalance** — itemId, locationId, batch, physicalQty, reservedQty (cached projection, composite unique)
- **StockLedger** — id, itemId, locationId, batch, delta, reason, refType, refId, idempotencyKey (UNIQUE), createdBy, createdAt (SOURCE OF TRUTH)
- **WorkOrder** — id, locationId, itemId, requiredQty, assignedUserId, status (ASSIGNED/IN_PROGRESS/COMPLETED)
- **Transfer** — id, sourceLocationId, destLocationId, itemId, quantity, status (REQUESTED/DISPATCHED/RECEIVED)
- **CustomerOrder** — id, customerRef, itemId, locationId, quantity, status (RESERVED/CANCELLED), salesUserId

---

## Business Logic Summary

### Inventory: Available = Physical − Reserved
- Enforced by atomic SQL: `UPDATE ... WHERE (physicalQty - reservedQty) >= $qty`
- Never goes negative — zero-row update means rejection (409 Conflict)

### Reservation Concurrency
- Single atomic conditional UPDATE inside a DB transaction
- Two concurrent reservations for more than available: exactly one succeeds, other gets 409

### Idempotency
- Every ledger-writing endpoint accepts `idempotencyKey` (unique constraint in DB)
- Duplicate key → returns original result without re-applying

### Transfer State Machine
- Strict `REQUESTED → DISPATCHED → RECEIVED` (separate state-machine module)
- DISPATCHED: deducts source physicalQty, destination unchanged
- RECEIVED: increases destination physicalQty
- Cannot be RECEIVED twice

### Work Order Shortage
- `shortage = max(requiredQty − availableAtLocation, 0)` computed on read, never stored

### Order Cancellation
- Changes status to CANCELLED, atomically releases reserved stock via RELEASE ledger entry

---

## Project Structure

```
fundsroom-assignment/
├── apps/
│   ├── api/                          # Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # SQL migrations
│   │   │   └── seed.ts               # Demo data seed
│   │   ├── src/
│   │   │   ├── app.ts                # Express app setup
│   │   │   ├── server.ts             # Server entry point
│   │   │   ├── config/env.ts         # Zod env validation
│   │   │   ├── db/prisma.ts          # Prisma client
│   │   │   ├── middleware/           # auth, rbac, errorHandler, requestId, validate
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Register, login, JWT
│   │   │   │   ├── inventory/        # Balances, ledger, reserve, receipt
│   │   │   │   ├── work-orders/      # CRUD + shortage calc
│   │   │   │   ├── transfers/        # State machine + dispatch/receive
│   │   │   │   ├── customer-orders/  # Reservation + cancel
│   │   │   │   ├── events/           # SSE endpoint
│   │   │   │   └── health/           # Health + DB check
│   │   │   ├── openapi/generator.ts  # Zod-to-OpenAPI auto-gen
│   │   │   └── utils/               # ApiError, logger
│   │   └── tests/                    # Vitest test suite
│   └── web/                          # Next.js frontend
│       └── src/
│           ├── app/                   # App Router pages
│           ├── components/            # UI components + 3D widgets
│           └── lib/                   # API client, auth context
├── docs/
│   ├── ERD.md                        # ER diagram (Mermaid)
│   └── postman_collection.json       # Postman collection
├── .env.example                      # Environment template
├── .github/workflows/ci.yml          # CI pipeline
├── docker-compose.yml                # Docker orchestration
└── package.json                      # Monorepo root
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. Spins up PostgreSQL 16 service
2. Installs dependencies
3. Generates Prisma client
4. Runs Vitest test suite with coverage
5. Builds API service

---

## Author & License

Built as a technical case study for Full-Stack Developer evaluation.
