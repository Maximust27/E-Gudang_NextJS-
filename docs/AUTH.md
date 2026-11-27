# E-Gudang — Authentication & Authorization

Phase 4 candidate. Follows PRD internal Credentials, ADMIN and OPERATOR. No public registration, social login or database session adapter. Auth.js v5 beta.32 is pinned for App Router compatibility; bcryptjs 3.0.3 is pinned. Review the prerelease dependency and security advisories before production use. The existing lockfile is updated from a real npm resolution, not handwritten.

## Security model

- Auth.js handles encrypted JWT cookies, CSRF and session endpoints. Eight-hour session maxAge is a starting policy. Set a strong unique AUTH_SECRET and canonical AUTH_URL; use HTTPS, secure proxy/host configuration and secure cookies in production. Never expose secrets or enable indiscriminate host trust.
- Zod normalizes email only. Passwords are never trimmed, logged or stored in plaintext. New users require at least 15 characters and at most 72 UTF-8 bytes (bcrypt's input limit). Cost 12 is the baseline; measure on target server. No default account. A generic error covers incorrect credentials, unknown, inactive and throttled accounts.
- Fixed-window login attempt limits are persisted in MySQL/MariaDB: 60/min global, 5/5min per known user, 10/min shared unknown account bucket. All allowed attempts count, including successful attempts. An atomic row update inside a short transaction prevents lost increments; bcrypt runs outside the database transaction. Unknown email addresses do not create arbitrary keys. Dummy verification reduces timing differences, not a guarantee against timing analysis. Global/account limits can temporarily deny legitimate users; tune from operations and add trusted edge rate limiting before external deployment.
- `getCurrentUser` validates the session and loads the current role, active flag and session version from the database; it uses React cache only for the render pass. It returns a DTO without password hash. `requireUser` redirects anonymous/revoked/inactive users. `requirePermission` denies forbidden RSC pages with notFound. Every sensitive server action/handler/data access must call an appropriate server guard and handle 401/403; hiding UI is not authorization.
- Session version must increment when credentials are reset, user is deactivated/reactivated or all sessions revoked in the future user management phase. Role is read fresh at each secure check. Sign-out clears the browser cookie; it does not by itself revoke a copied JWT. Session version revocation protects app data even if the library's raw session endpoint still sees an encrypted token until expiration.
- Shell, each placeholder page, and menu search respect the role map. The shared app layout may remain mounted across client navigation; role changes are enforced at protected data/page boundaries and the UI refreshes on reload. No sensitive business data is included in static fallback. Do not rely on layout alone or introduce global cache for user-specific data.
- No MFA, password reset UI, user CRUD or internet-facing deployment hardening in this phase. Operator account creation via trusted CLI is for local audit; Admin user management belongs to the settings feature.

## Permission matrix

| Operation | Admin | Operator |
| --- | --- | --- |
| Dashboard, product view, inbound/outbound, count opname, view reports | Yes | Yes |
| Manage/import master products | Yes | No |
| Approve opname, adjust blocked/expired stock, reverse | Yes | No |
| Export reports, settings, manage users, audit | Yes | No |

`lib/permissions.ts` is the source of role grants and route permissions. Future services use the same permissions rather than inventing role strings.

## Local setup

1. Pull branch and use `npm ci`, then `npm run check`.
2. Keep DATABASE_URL in the private .env. Confirm the target with:
   ```powershell
   node --env-file=.env -p "new URL(process.env.DATABASE_URL).pathname"
   ```
   Verify the database migration state. Test the new migration on e_gudang_test first using the temporary environment override from DATABASE.md. Apply migrations with `npm run db:migrate` only; do not reset a database with data.
3. Generate a random secret using `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Copy it into the private .env as AUTH_SECRET and set AUTH_URL=http://localhost:3000. Do not share the secret or commit .env. Each environment gets its own secret.
4. Run `npm run auth:create-user` in an interactive terminal. Enter email, name, role ADMIN or OPERATOR, then password twice (input hidden). CLI is for trusted provisioning with DB access, not public registration. Duplicate email is rejected; it never overwrites existing accounts. Use separate test accounts and never put passwords in command arguments. Run after Prisma generation and migrations.
5. `npm run dev`, open http://localhost:3000. Anonymous dashboard redirects to login. Test both roles; logout before switching accounts.

## Automated verification

`npm run check` covers credentials schema, role permissions, navigation, bcrypt and existing tests. The database workflow starts a production Next.js build against isolated MariaDB 11.4, runs `npm run auth:smoke`, and removes test user fixtures afterward. The smoke test requires a _test database and a local HTTP server. It checks guest denial, valid and invalid login, inactive user, role enforcement after JWT creation, session-version revocation, sign-out and fixed-window throttling. It is not a browser/penetration test.

For local auth smoke use a separate e_gudang_test and a separate temporary AUTH_SECRET/AUTH_URL. Start the application using those same environment variables. Run `npm run auth:smoke` from another terminal with the identical test DATABASE_URL and AUTH_URL; never point it to an operational server. Do not run simultaneous auth smoke tests in the same database.

## Manual acceptance

- [ ] Both themes and mobile login; labels, keyboard, visibility toggle, error announcements and pending button.
- [ ] Guest direct access to every dashboard route redirects to login.
- [ ] Admin can access settings; Operator cannot (including direct URL and menu search).
- [ ] Wrong credentials and inactive account are rejected without account-specific details.
- [ ] Refresh retains session and sidebar preference; logout denies protected routes.
- [ ] After account/role/version changes, server authorization reflects current database.
- [ ] New migration, schema drift, seed, previous database smoke, auth smoke and quality checks pass.
- [ ] Audit dependency advisories and deployment configuration before production.

No UI design tokens, inventory engine, operational account or database contents were changed by the implementor.
