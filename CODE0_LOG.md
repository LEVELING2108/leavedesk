# Code0 Usage Log

One line per task, in the order of the 12-task plan I approved in Code0. Every task was followed by the API tests, the client build and the linter.

| Date/Time | Area | Task | What Code0 suggested | What I changed / validated |
|-----------|------|------|----------------------|----------------------------|
| 2026-10-14 02:04 | database | User and LeaveRequest models | Mongoose schemas with enums, `select: false` on password and refresh-token hash, compound index `{ employee, startDate, endDate }` | Index matches the overlap query; password and token hash are never returned by default |
| 2026-10-14 02:05 | API | Auth/validation middleware and token utils | `authenticate` reloads the user on every request; `authorize(...roles)`; zod `validate` for body, query and params | Role changes and deactivation apply on the next request, not when the token expires |
| 2026-10-14 02:05 | API | Auth endpoints | Rotating refresh token in an httpOnly, SameSite=Strict cookie with reuse detection; rate limit on login/register | `register` has no `role` field, so nobody can sign up as admin |
| 2026-10-14 02:07 | API | Leave endpoints | Overlap check, date rules, no self-review, conditional update so a request is decided once | Walked through the overlap condition with sample dates, including ranges that share one day |
| 2026-10-14 02:09 | database | User endpoints and seed script | Admin user management; re-runnable seed with demo accounts | Ran the seed against the Docker MongoDB |
| 2026-10-14 02:10 | API | Socket.IO handshake and notifier | JWT-checked handshake, per-user rooms, `notifyUser()` so services don't import Socket.IO | Notifier is a no-op under tests, so services stay testable |
| 2026-10-14 02:12 | component | API interceptors, AuthContext, protected routes | Access token kept in memory; one shared refresh promise for parallel 401s | Route guards are UX only; the API enforces roles itself |
| 2026-10-14 02:14 | component | Login, Register, My Leaves | Forms, filters, pagination, loading/error/empty states | Lint raised three warnings after this task (next row) |
| 2026-10-14 02:14 | refactoring / debugging | Lint fixes | Move constants out of the component file; derive `loading` in `useApi` instead of setting state in an effect | Lint clean, tests pass; details in README "Issues resolved" |
| 2026-10-14 02:15 | component | Approvals and Admin Users pages | Approve/reject with comment; role and manager editing | Tested approve as the manager account |
| 2026-10-14 02:21 | component | Real-time toasts | `SocketProvider`, toasts, `useLeaveEvents` to refresh lists | Tested in two browser sessions: employee applies → manager toast; manager approves → employee toast |
| 2026-10-14 02:27 | testing | Auth, RBAC and leave tests | Jest + Supertest on in-memory MongoDB | 50/50 passing |
| 2026-10-14 02:30 | docs | README | Features, API reference, design decisions, setup | Did not run Code0's final "re-commit everything as six commits" suggestion; history was already per task |
