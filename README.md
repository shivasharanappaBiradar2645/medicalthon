# PalliaTrack - Backend Architecture

## 1. High-Level Architecture: A Layered & Hybrid Approach

The backend is built on a **Layered Architecture**, a robust and maintainable pattern. It is composed of two primary operational models:

1.  **Synchronous Core (REST API):** Handles all real-time client interactions (e.g., from a web or mobile app) via a standard REST API.
2.  **Asynchronous Service (Background Worker):** Manages scheduled, non-interactive tasks like inventory management and notifications, operating independently from the API.

---

## 2. Core Technologies

*   **Runtime:** Node.js
*   **Web Framework:** Express.js
*   **Database:** PostgreSQL
*   **Data Access Layer:** Drizzle ORM
*   **Database Migrations:** Drizzle Kit

---

## 3. The Synchronous Flow: API Request Lifecycle

This flow follows a classic Model-Controller pattern for handling user requests:

1.  **Entry & Routing (`app.mjs` -> `routes/`):** An HTTP request enters the main `app.mjs` file. Express then uses the routers defined in the `routes` directory to match the endpoint (e.g., `GET /api/doctors`) to a specific controller function.

2.  **Business Logic (`controllers/`):** The controller function takes over, containing the core business logic. It processes the request, validates data, and orchestrates the necessary actions.

3.  **Data Interaction (`models/`):** The controller interacts with the PostgreSQL database using the **Drizzle ORM**. All database tables, columns, and relations are defined in `models/schema.mjs`, providing a single source of truth for our data structure.

4.  **Response:** The controller formats a JSON response and sends it back to the client.

---

## 4. The Asynchronous Flow: Background Worker Service

For tasks that don't need to happen immediately, the system uses a background worker.

*   **Implementation (`services/inventoryWorker.mjs`):** This service is launched alongside the main application.
*   **Mechanism:** It uses a `setInterval` timer to periodically trigger critical background tasks.
*   **Responsibilities:**
    *   Checking medicine inventory levels.
    *   Automatically creating restock orders when stock is low.
    *   Sending notifications based on system events.

---
