# LeaveDesk

A leave management web app built on the MERN stack. Employees apply for leave, managers approve or reject requests for their team, and admins manage users and roles. Status changes are pushed to users in real time.

> 🚧 Work in progress. Sections marked TODO are filled in as features land.

## Key Features

- [ ] JWT authentication (short-lived access token + httpOnly refresh-token cookie)
- [ ] Role-based access control: `employee`, `manager`, `admin` (enforced server-side)
- [ ] Leave requests: create, list (paginated/filterable), cancel; overlap detection
- [ ] Manager approval workflow with comments
- [ ] Admin user management (roles, assign managers)
- [ ] Real-time notifications via Socket.IO
- [x] Centralised error handling and request validation (zod)
- [x] Security middleware: helmet, CORS allow-list, body size limit
- [ ] Rate-limited auth endpoints
- [ ] API tests (Jest + Supertest + in-memory MongoDB)

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, React Router, Axios, Socket.IO client |
| Backend  | Node.js 24, Express 5, Socket.IO |
| Database | MongoDB 7, Mongoose |
| Auth     | JSON Web Tokens, bcrypt |
| Testing  | Jest, Supertest, mongodb-memory-server |
| Tooling  | Docker Compose (MongoDB), oxlint |

## Project Structure

```
leavedesk/
├── client/               # React app (Vite)
│   └── src/
│       ├── api/          # Axios instance + interceptors
│       ├── components/   # Reusable UI
│       ├── context/      # Auth context
│       ├── hooks/
│       ├── pages/
│       └── routes/       # Protected / role-based routes
├── server/               # Express API
│   ├── src/
│   │   ├── config/       # env + DB connection
│   │   ├── controllers/  # HTTP layer
│   │   ├── middleware/   # auth, RBAC, validation, errors
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/
│   │   ├── services/     # Business logic
│   │   ├── sockets/      # Socket.IO handlers
│   │   ├── utils/
│   │   ├── validators/   # zod schemas
│   │   ├── app.js        # Express app (importable by tests)
│   │   └── server.js     # HTTP + Socket.IO bootstrap
│   └── tests/
└── docker-compose.yml    # Local MongoDB
```

## Setup & Installation

**Prerequisites:** Node.js 20+, npm, and either Docker or a local/Atlas MongoDB instance.

```bash
git clone <repo-url>
cd leavedesk
npm run install:all

cp server/.env.example server/.env   # then set JWT secrets (and MONGO_URI if not using Docker)
```

## Running the App

```bash
npm run db     # start MongoDB in Docker (skip if using Atlas/local Mongo)
npm run dev    # API on http://localhost:5000, web on http://localhost:5173
npm test       # run API tests
```

## API Reference

TODO: table of endpoints, methods and required roles.

## Design Decisions

TODO: e.g. why refresh tokens live in httpOnly cookies, why app.js is separate from server.js, how overlap detection works.

## AI Development Experience (Code0)

✅ **Code0 was used** for this project's development.

TODO: brief explanation of how Code0 fit into the workflow (component development, API implementation, debugging, database integration, refactoring, testing). All Git and GitHub operations (init, commits, repo creation, push) were run from the Code0 terminal.

### Tasks where Code0 helped

1. TODO
2. TODO
3. TODO

### Validating suggestions

TODO: how Code0 output was checked (tests, manual API calls, code review) and at least one suggestion that was corrected or rejected, and why.

### Issues resolved

TODO: a technical problem hit during development and how it was debugged.

> Note: the initial project scaffold (folder layout, config files, dependency setup) was prepared with Claude Code before development began in Code0.
