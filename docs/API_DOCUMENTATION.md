# 📚 Complete API Reference & Documentation

This document provides exhaustive API documentation for all REST endpoints, parameters, authentication requirements, sample cURL requests, and response schemas in the **Foundry Mini Operations ERP**.

---

## 🔐 Base URL & Headers

- **Base URL**: `http://localhost:4000/api/v1`
- **Root Overview**: `http://localhost:4000/`
- **Health Check**: `http://localhost:4000/health`

### Required Headers

| Header | Value | Required On |
|:---|:---|:---|
| `Content-Type` | `application/json` | All `POST` & `PATCH` requests |
| `Authorization` | `Bearer <JWT_TOKEN>` | All protected endpoints |

---

## 1. System & Authentication Endpoints

### `GET /`
Returns API name, online status, health check links, and endpoint index.

* **Auth**: None
* **Response `200 OK`**:
```json
{
  "name": "Foundry Mini Operations ERP API",
  "status": "online",
  "version": "1.0.0",
  "webApp": "http://localhost:3000",
  "healthCheck": "http://localhost:4000/health"
}
```

---

### `GET /health`
Database readiness and server health check.

* **Auth**: None
* **Response `200 OK`**:
```json
{
  "status": "HEALTHY",
  "database": "CONNECTED",
  "timestamp": "2026-09-25T01:50:00.000Z"
}
```

---

### `POST /api/v1/auth/login`
Authenticates user and returns JWT bearer token.

* **Auth**: None
* **Request Body**:
```json
{
  "email": "admin@foundry.com",
  "password": "password123"
}
```
* **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "admin@foundry.com",
    "role": "ADMIN"
  }
}
```

---

## 2. Inventory Management Endpoints

### `GET /api/v1/inventory/balances`
Retrieves live inventory balances (`physicalQty`, `reservedQty`, `availableQty`).

* **Auth**: JWT (`ADMIN`, `OPS`, `SALES`)
* **Response `200 OK`**:
```json
[
  {
    "id": "bal-123",
    "itemId": "item-001",
    "itemName": "Industrial Lithium Battery Pack 400V",
    "locationId": "loc-001",
    "locationName": "East Coast Logistics Hub",
    "batch": "BATCH-2026-N1",
    "physicalQty": 100,
    "reservedQty": 20,
    "availableQty": 80,
    "isLowStock": false
  }
]
```

---

### `GET /api/v1/inventory/ledger`
Retrieves immutable double-entry stock ledger audit trail.

* **Auth**: JWT (`ADMIN`, `OPS`, `SALES`)
* **Response `200 OK`**:
```json
[
  {
    "id": "led-456",
    "itemId": "item-001",
    "locationId": "loc-001",
    "batch": "BATCH-2026-N1",
    "delta": 100,
    "reason": "RECEIPT",
    "refType": "STOCK_RECEIPT",
    "idempotencyKey": "RECEIPT-item-001-loc-001-1700000000",
    "createdAt": "2026-09-25T01:40:00.000Z"
  }
]
```

---

### `POST /api/v1/inventory/receipt`
Posts a new stock shipment receipt, increasing physical and available stock.

* **Auth**: JWT (`ADMIN`, `OPS`)
* **Request Body**:
```json
{
  "locationId": "00000000-0000-0000-0000-000000000001",
  "itemId": "00000000-0000-0000-0000-000000000002",
  "batch": "BATCH-2026-N1",
  "quantity": 100,
  "idempotencyKey": "RECEIPT-ITEM2-LOC1-BATCH-N1-999"
}
```
* **Response `201 Created`**:
```json
{
  "idempotent": false,
  "ledgerId": "led-789",
  "balance": {
    "physicalQty": 100,
    "reservedQty": 0,
    "availableQty": 100
  }
}
```

---

## 3. Work Order & Shortage Endpoints

### `GET /api/v1/work-orders`
Retrieves all work orders with real-time computed material shortages.

* **Auth**: JWT (`ADMIN`, `OPS`, `SALES`)
* **Response `200 OK`**:
```json
[
  {
    "id": "wo-101",
    "requiredQty": 50,
    "availableAtLocation": 20,
    "shortage": 30,
    "hasShortage": true,
    "status": "ASSIGNED",
    "item": { "name": "Precision Ceramic Micro-Bearing" },
    "location": { "name": "Central Foundry Warehouse" }
  }
]
```

---

### `POST /api/v1/work-orders`
Creates a new Work Order. Restricted to Admin role.

* **Auth**: JWT (`ADMIN` only)
* **Request Body**:
```json
{
  "locationId": "00000000-0000-0000-0000-000000000001",
  "itemId": "00000000-0000-0000-0000-000000000002",
  "requiredQty": 50
}
```
* **Response `201 Created`**: Returns created work order object with shortage computation.

---

### `PATCH /api/v1/work-orders/:id/status`
Updates Work Order status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`).

* **Auth**: JWT (`ADMIN`, `OPS`)
* **Request Body**:
```json
{
  "status": "IN_PROGRESS"
}
```

---

## 4. Internal Stock Transfer Endpoints

### `GET /api/v1/transfers`
Lists all internal stock transfer requests.

* **Auth**: JWT (`ADMIN`, `OPS`, `SALES`)

---

### `POST /api/v1/transfers`
Requests an internal stock transfer between two locations.

* **Auth**: JWT (`ADMIN`, `OPS`)
* **Request Body**:
```json
{
  "sourceLocationId": "loc-source-uuid",
  "destLocationId": "loc-dest-uuid",
  "itemId": "item-uuid",
  "quantity": 25
}
```

---

### `PATCH /api/v1/transfers/:id/status`
Dispatches or Receives an internal stock transfer.

* **Auth**: JWT (`ADMIN`, `OPS`)
* **Request Body (Dispatch)**:
```json
{
  "status": "DISPATCHED",
  "batch": "BATCH-2026-A1",
  "idempotencyKey": "DISPATCH-TR-101-1700000"
}
```
* **Request Body (Receive)**:
```json
{
  "status": "RECEIVED",
  "batch": "BATCH-2026-A1",
  "idempotencyKey": "RECEIVE-TR-101-1700000"
}
```

---

## 5. Customer Orders & Stock Release Endpoints

### `GET /api/v1/orders`
Lists customer order reservations.

* **Auth**: JWT (`ADMIN`, `OPS`, `SALES`)

---

### `POST /api/v1/orders`
Creates a customer order and atomically reserves stock.

* **Auth**: JWT (`ADMIN`, `SALES`)
* **Request Body**:
```json
{
  "customerRef": "ACME-CORP-2026",
  "itemId": "item-uuid",
  "locationId": "location-uuid",
  "batch": "BATCH-2026-A1",
  "quantity": 15,
  "idempotencyKey": "ORD-ACME-2026-1700000"
}
```

---

### `PATCH /api/v1/orders/:id/status`
Cancels a customer order and atomically releases reserved stock back into available inventory.

* **Auth**: JWT (`ADMIN`, `SALES`)
* **Request Body**:
```json
{
  "status": "CANCELLED"
}
```
* **Response `200 OK`**: Returns cancelled order record with updated reservation release.

---

## 6. Real-time SSE Events Endpoint

### `GET /api/v1/events/sse`
Establishes a Server-Sent Events stream for real-time inventory updates.

* **Auth**: JWT
* **Event Format**:
```text
event: inventory:updated
data: {"itemId":"item-001","locationId":"loc-001","batch":"BATCH-2026-N1","availableQty":80}
```
