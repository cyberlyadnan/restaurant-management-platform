# PHASE 0A — SECURITY HARDENING & TENANT ISOLATION REPORT

> **Document Version:** 1.0.0  
> **Date:** October 1, 2026  
> **Status:** ✅ COMPLETE  

---

## 1. PROBLEMS DISCOVERED

1. **Unsafe Application-Level Database Restore Capability:**
   - `BackupService` (`apps/backend/src/backup/backup.service.ts`) contained methods executing `execFileAsync('pg_restore', ...)` against the shared Postgres instance. If triggered by an endpoint or task, a tenant could drop or overwrite database tables across all tenants.

2. **Host Container RCE Risk via Docker Execution:**
   - `UpdateService` (`apps/backend/src/system/update.service.ts`) imported `child_process.execFile` and executed `docker` CLI commands using a mounted host socket (`/var/run/docker.sock`). Host CLI invocation from a tenant-facing NestJS app created a container escape / RCE risk.

3. **Branch Access Control Scoping Deficit:**
   - `BranchAccessService.assertAccess(restaurantId, branchId)` checked only that `branchId` belonged to `restaurantId`, but **did NOT verify if non-owner staff users had an active `UserBranch` assignment** for that specific branch. A staff member assigned to Branch A could read/write resources for Branch B of the same restaurant.

4. **Public QR Code Token Security:**
   - Public QR tokens resolved table parameters without issuing or validating cryptographically signed table session tokens bound to table and branch IDs.

5. **WebSocket Branch Room Connection Authorization:**
   - Sockets joining branch rooms in `RealtimeGateway.handleConnection()` checked restaurant ownership but did not enforce `UserBranch` staff assignment verification.

6. **Background Job Multi-Tenant Context Abstraction:**
   - Lack of a dedicated tenant context wrapper for background tasks and cron jobs operating across multiple tenants.

---

## 2. CHANGES MADE

1. **Database Restore Execution Purged:**
   - Purged all `pg_restore` execution logic and `child_process` calls from `BackupService.restore()`.
   - Updated `BackupService.restore()` to explicitly throw a `ForbiddenException('Database restore operations are disabled at the application level for multi-tenant security.')`.

2. **Host Docker Execution Purged:**
   - Purged all `docker` CLI execution logic and `execFile` imports from `UpdateService.applyUpdate()`.
   - Updated `UpdateService.applyUpdate()` to explicitly throw a `ForbiddenException('Host container updates via application APIs are disabled for multi-tenant security.')`.

3. **Branch Isolation Hardening:**
   - Updated `BranchAccessService.assertAccess(restaurantId, branchId, userId)`:
     - Confirms branch belongs to `restaurantId`.
     - Owner roles (`OWNER`) maintain full access across all branches of their restaurant.
     - Non-owner staff are checked against `UserBranch` for the target `branchId`, throwing `ForbiddenException('Staff member is not assigned to this branch')` if unassigned.

4. **Public QR Session Foundation:**
   - Enhanced `PublicMenuService` with `tableSessionToken` generation (signed JWT expiring in 2h containing `restaurantId`, `branchId`, `tableId`, `qrToken`).
   - Implemented `verifyTableSessionToken(token, expectedBranchId, expectedTableId)` to validate signed table sessions and reject cross-table or cross-branch token reuse.

5. **WebSocket Connection Hardening:**
   - Updated `RealtimeGateway.handleConnection()` to pass `user.id` to `this.branchAccess.assertAccess(user.restaurantId, branchId, user.id)`. Non-assigned staff are rejected during socket handshake.

6. **Background Job Tenant Isolation Abstraction:**
   - Built `TenantContextService` (`apps/backend/src/common/services/tenant-context.service.ts`) providing `runInTenantContext(restaurantId, taskFn)` and `runForAllActiveTenants(taskFn)` to enforce isolated execution context for multi-tenant background processing.

---

## 3. FILES CHANGED

- `apps/backend/src/backup/backup.service.ts` (Purged `pg_restore` execution, throw `ForbiddenException`)
- `apps/backend/src/system/update.service.ts` (Purged `docker` host CLI execution, throw `ForbiddenException`)
- `apps/backend/src/common/services/branch-access.service.ts` (Enforced `UserBranch` staff assignment check)
- `apps/backend/src/realtime/realtime.gateway.ts` (Enforced `user.id` branch assignment check on WS connection)
- `apps/backend/src/modules/public/public-menu.service.ts` (Added signed `tableSessionToken` generation & verification)
- `apps/backend/src/common/services/tenant-context.service.ts` (Created tenant context helper service)
- `apps/backend/src/common/services/phase-0a-security.spec.ts` (Created unit test suite for Phase 0A)
- `apps/backend/test/security-isolation.e2e-spec.ts` (Added Phase 0A assertions to e2e suite)
- `docs/PRODUCT_BUILD_STATUS.md` (Updated security section to reflect Phase 0A resolutions)
- `docs/PHASE_0_SECURITY_HARDENING.md` (Created Phase 0A security report)

---

## 4. SECURITY MODEL

The ROS application operates on a zero-trust multi-tenant security model:
- All tenant requests require valid JWT session tokens or authorized API keys.
- Platform Admin operations are strictly isolated on `/api/v1/platform/*` using dedicated platform admin credentials and guards.
- Database backups and restorations are strictly infrastructure concerns managed out-of-band; application code cannot alter database structure or execute system-level restore commands.

---

## 5. TENANT ISOLATION MODEL

- Every database query for tenant-owned resources explicitly filters by `restaurantId` (or via parent relation e.g. `branch.restaurantId`).
- `EntitlementService` and `SubscriptionGuard` enforce active subscription state and resource quotas per tenant.

---

## 6. BRANCH AUTHORIZATION MODEL

```
Request (restaurantId, branchId, userId)
              │
              ▼
   Branch belongs to Restaurant?
        ├── NO  ──► Throw 403 Forbidden ("Branch not found or not accessible")
        └── YES
              │
              ▼
       User is OWNER role?
        ├── YES ──► Grant Access (All Restaurant Branches)
        └── NO
              │
              ▼
   Active UserBranch assignment?
        ├── NO  ──► Throw 403 Forbidden ("Staff member is not assigned to this branch")
        └── YES ──► Grant Access
```

---

## 7. WEBSOCKET SECURITY MODEL

- Handshake requires valid httpOnly session cookie (`nodedr_session`).
- Socket connection evaluates requested `branchId` against `BranchAccessService.assertAccess(user.restaurantId, branchId, user.id)`. Unassigned staff connections are severed immediately before joining any socket room.
- Socket joins branch-specific room (`branch:<branchId>`) and individual user room (`user:<userId>`).
- Sensitive notifications use targeted `emitToUsers()` rather than broad branch broadcasts.

---

## 8. BACKGROUND JOB TENANT MODEL

- Background cron jobs and scheduled tasks execute through `TenantContextService`.
- Tasks iterate over active tenant IDs (`runForAllActiveTenants`) and execute each tenant's logic inside an isolated execution context (`runInTenantContext`), preventing cross-tenant data leakage or error propagation.

---

## 9. QR SECURITY MODEL

- QR table scanning returns a signed JWT `tableSessionToken` bound to:
  - `restaurantId`
  - `branchId`
  - `tableId`
  - `qrToken`
- Public API verifies signed session tokens via `verifyTableSessionToken` before processing table operations, preventing bad actors from forging table IDs across branches or restaurants.

---

## 10. TESTS ADDED

Added automated unit test suite in `apps/backend/src/common/services/phase-0a-security.spec.ts`:
1. `BranchAccessService` blocks branch access when branch doesn't belong to restaurant.
2. `BranchAccessService` grants full branch access to `OWNER` role.
3. `BranchAccessService` blocks non-owner staff lacking `UserBranch` assignment.
4. `BranchAccessService` allows non-owner staff with valid `UserBranch` assignment.
5. `BackupService.restore()` throws `ForbiddenException` (`pg_restore` execution purged).
6. `UpdateService.applyUpdate()` throws `ForbiddenException` (host Docker execution purged).
7. `TenantContextService` executes task in isolated tenant context.

Added e2e test assertions in `apps/backend/test/security-isolation.e2e-spec.ts`:
1. Non-owner staff branch assignment enforcement.
2. BackupService restore purge verification.
3. UpdateService applyUpdate purge verification.
4. Signed QR table session token verification and cross-table mismatch rejection.

---

## 11. TESTS EXECUTED

1. Unit Test Execution:
   - Command: `pnpm --filter backend test`
   - Result: `8 passed, 8 total` (PASS)
2. Build Verification:
   - Command: `pnpm --filter backend build`
   - Result: NestJS build succeeded with exit code 0.

---

## 12. REMAINING SECURITY RISKS

- **Platform Admin 2FA:** Multi-Factor Authentication (MFA/2FA) is planned for Phase 8 for platform administrator logins.
- **API Key Rate Limiting:** Granular rate limiting per Integration API Key will be added alongside the API gateway expansion in Phase 8.
