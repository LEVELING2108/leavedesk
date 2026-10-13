# LeaveDesk

A leave management web app built on the MERN stack. Employees apply for leave, managers approve or reject requests for their team, and admins manage users and roles. Status changes are pushed to users in real time.

## Key Features

- [x] JWT authentication: 15-minute access token in memory + rotating refresh token in an httpOnly cookie, with reuse detection
- [x] Role-based access control: `employee`, `manager`, `admin`, enforced server-side on every route
- [x] Ownership checks: employees see only their own leaves; managers only review requests routed to them
- [x] Leave requests: apply, list (paginated + filterable), cancel; overlap detection and date validation
- [x] Manager approval workflow with comments; a request can be decided only once, and never by its owner
- [x] Admin user management: change roles, assign managers, activate/deactivate accounts
- [x] Real-time notifications via Socket.IO (JWT-authenticated handshake, per-user rooms)
- [x] Centralised error handling and zod validation on every body, query and route param
- [x] Security middleware: helmet, CORS allow-list, 10 kB body limit, rate-limited login/register
- [x] Loading, error and empty states throughout the UI
- [x] 50 API tests (Jest + Supertest + in-memory MongoDB)

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, React Router 7, Axios, Socket.IO client |
| Backend  | Node.js 24, Express 5, Socket.IO |
| Database | MongoDB 7, Mongoose |
| Auth     | JSON Web Tokens, bcrypt |
| Validation | zod |
| Testing  | Jest, Supertest, mongodb-memory-server |
| Tooling  | Docker Compose (MongoDB), oxlint |

## Project Structure

```
leavedesk/
├── client/                 # React app (Vite)
│   └── src/
│       ├── api/            # Axios instance, token + refresh interceptors
│       ├── components/     # Layout, LeaveForm, tables, badges, pagination, states
│       ├── context/        # AuthProvider, SocketProvider
│       ├── hooks/          # useAuth, useApi, useLeaveEvents
│       ├── pages/          # Login, Register, My leaves, Approvals, Admin users
│       ├── routes/         # ProtectedRoute (role-aware), GuestRoute
│       └── utils/
├── server/                 # Express API
│   ├── scripts/seed.js     # Demo accounts
│   ├── src/
│   │   ├── config/         # env + DB connection
│   │   ├── controllers/    # HTTP layer: read req, call service, shape response
│   │   ├── middleware/     # authenticate, authorize, validate, errors
│   │   ├── models/         # User, LeaveRequest
│   │   ├── routes/
│   │   ├── services/       # Business rules (auth, leaves, users)
│   │   ├── sockets/        # Socket.IO auth + notifier
│   │   ├── utils/
│   │   ├── validators/     # zod schemas
│   │   ├── app.js          # Express app (importable by tests)
│   │   └── server.js       # HTTP + Socket.IO bootstrap, graceful shutdown
│   └── tests/              # auth, rbac, leaves, health
└── docker-compose.yml      # Local MongoDB on port 27018
```

## Setup & Installation

**Prerequisites:** Node.js 20+, npm, and either Docker or a local/Atlas MongoDB instance.

```bash
git clone https://github.com/LEVELING2108/leavedesk.git
cd leavedesk
npm run install:all

cp server/.env.example server/.env   # then set real JWT secrets (and MONGO_URI if not using Docker)
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Running the App

```bash
npm run db                     # start MongoDB in Docker (skip if using Atlas/local Mongo)
npm run seed --prefix server   # create demo accounts (safe to re-run)
npm run dev                    # API on http://localhost:5000, web on http://localhost:5173
npm test                       # run API tests (downloads a MongoDB binary on first run)
```

### Demo accounts

All use the password `Password123`.

| Email | Role | Reports to |
|-------|------|-----------|
| admin@leavedesk.dev | admin | — |
| manager@leavedesk.dev | manager | admin |
| employee1@leavedesk.dev | employee | manager |
| employee2@leavedesk.dev | employee | manager |

To see real-time notifications, sign in as `employee1` in one browser and `manager` in another (or a private window), then apply for and approve a leave.

## API Reference

All responses use `{ success: true, data }` or `{ success: false, message, details? }`. Authenticated routes need `Authorization: Bearer <accessToken>`.

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/api/health` | public | API + DB status |
| POST | `/api/auth/register` | public, rate-limited | Always creates an `employee` |
| POST | `/api/auth/login` | public, rate-limited | Returns access token, sets refresh cookie |
| POST | `/api/auth/refresh` | refresh cookie | Rotates the refresh token |
| POST | `/api/auth/logout` | refresh cookie | Revokes the refresh token |
| GET | `/api/auth/me` | any role | Current user |
| POST | `/api/leaves` | any role | `{ type, startDate, endDate, reason? }`, dates as `YYYY-MM-DD` |
| GET | `/api/leaves/mine` | any role | `?page&limit&status&type` |
| PATCH | `/api/leaves/:id/cancel` | owner | Pending requests only |
| GET | `/api/leaves/approvals` | manager, admin | Managers: requests routed to them; admins: all |
| PATCH | `/api/leaves/:id/review` | assigned manager, admin | `{ status: approved\|rejected, comment? }` |
| GET | `/api/users/team` | manager, admin | Direct reports |
| GET | `/api/users` | admin | `?page&limit&role&search` |
| GET | `/api/users/approvers` | admin | Active managers and admins |
| PATCH | `/api/users/:id` | admin | `{ role?, manager?, isActive? }` |

**Socket.IO events** (server → client): `leave:created` and `leave:cancelled` go to the approver, `leave:reviewed` goes to the employee.

### Status codes

`400` validation / bad id · `401` missing, invalid or expired token · `403` wrong role or not your resource · `404` not found · `409` overlap, duplicate email, already decided · `429` too many login attempts.

## Design Decisions

- **Access token in memory, refresh token in an httpOnly cookie.** JavaScript can't read the refresh cookie, so an XSS bug can't steal a long-lived session. The access token is never written to `localStorage`; a page reload gets a fresh one from `/auth/refresh`. The cookie is `SameSite=Strict` and scoped to `/api/auth`, so it isn't sent with any other request.
- **Refresh token rotation with reuse detection.** The server stores only a SHA-256 hash of the current refresh token. Every refresh swaps it for a new one in a single conditional update, so two concurrent refreshes can't both win. If an old, validly signed token shows up again it has been copied, so the session is revoked. The client funnels all refreshes through one in-flight promise so its own parallel requests never trip this.
- **Authorization on the server, always.** `authenticate` reloads the user on every request, so a role change or deactivation applies immediately rather than when the token expires. `authorize(...roles)` gates routes, and services check ownership (who the request belongs to, who it's routed to). The React route guards are for UX only.
- **Approver snapshot.** A leave request stores its approver at creation. Reassigning an employee's manager later doesn't silently move their open requests.
- **Overlap detection.** Two date ranges overlap when each starts on or before the other ends: `existing.start <= new.end && existing.end >= new.start`, over the employee's pending and approved requests. A compound index on `{ employee, startDate, endDate }` backs the query. Cancelled and rejected requests free their dates.
- **Dates are date-only, stored at UTC midnight.** Leave is about calendar days, not instants, so `YYYY-MM-DD` input avoids timezone off-by-one bugs. `days` counts calendar days inclusively; weekends and holidays aren't excluded.
- **Race-safe state changes.** Reviewing uses `findOneAndUpdate({ _id, status: 'pending' })`, so two managers clicking at once can't both decide a request.
- **`app.js` separate from `server.js`.** Tests import the Express app directly with Supertest, without opening a port, connecting sockets or reading the real database.
- **Notifier pattern.** Services call `notifyUser()` rather than importing Socket.IO. Under tests no `io` is registered and notifications are no-ops, which keeps business logic testable.
- **Layering.** Routes declare middleware, controllers translate HTTP, services hold the rules, and `errorHandler` turns `ApiError`, zod, Mongoose cast and duplicate-key errors into one response shape.

### Known limitations

- One refresh session per user: logging in elsewhere replaces the previous session's refresh token.
- No leave balances or holiday calendar.
- The overlap check and the insert aren't one transaction, so two simultaneous submissions for the same dates could both pass.

## AI Development Experience (Code0)

✅ **Code0 was used** for this project's development.

I used Code0 inside VS Code as a planning and implementation partner. It asked about the decisions that were mine to make: scope (everything, including real-time and admin), leave types without balances, and that it would implement while I reviewed. It then wrote a plan with a 12-task breakdown that I approved before any code changed. It worked through those tasks one at a time, running the test suite, the client build and the linter after each. Most Git and GitHub operations (init, commits, repo creation, push) were run from the Code0 terminal; a few commits and pushes near the end were made with Claude Code.

### Tasks where Code0 helped

1. **API creation:** the leave endpoints (apply, list, cancel, review), including the overlap query, date validation and the rule that a request can't be reviewed by its owner or decided twice.
2. **Authentication and security:** refresh-token rotation with reuse detection, plus the client-side single-flight refresh that stops parallel requests from tripping it.
3. **Component development:** the React pages (My leaves, Approvals, Admin users), the shared table, filter and pagination components, and the loading, error and empty states.
4. **Testing:** a Jest + Supertest suite of 50 tests on an in-memory MongoDB, covering auth, RBAC and the leave edge cases.
5. **Debugging and refactoring:** the linter flagged a `set-state-in-effect` problem in the data-fetching hook and constants exported from a component file. Code0 refactored the hook to derive `loading` instead of setting it in the effect, and moved the enums into a shared module.

### Validating suggestions

TODO (write in your own words): how you checked Code0's output, for example reading each diff, running `npm test` and the app, or trying the API by hand. Include at least one suggestion you corrected or rejected, and why.

### Issues resolved

TODO (write in your own words): a technical problem you hit during development and how you debugged it.

> Note: the initial project scaffold (folder layout, config files, dependency setup) was prepared with Claude Code before development began in Code0.
